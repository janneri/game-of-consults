import {Bot, GameState, GameEvent, BotAction} from './types';
import {v4 as uuidv4} from 'uuid';
import {BotInterpreter} from './bot-interpreter';
import {
    SKILLS,
    AREAS,
    COURSES,
    INVALID_MOVE_ENERGY_PENALTY,
    MOVE_ENERGY_COST,
    PROJECT_FAIL_ENERGY_COST,
    PROJECT_SUCCESS_ENERGY_COST,
    INITIAL_BOT_MONEY,
    INITIAL_BOT_ENERGY,
    RELAXATION_ACTIVITIES,
    RELAXATION_ENERGY_RANGE,
    COURSES_PER_GAME,
    EASY_MARKET_INITIAL_PROJECTS_MIN,
    EASY_MARKET_INITIAL_PROJECTS_MAX,
    HARD_MARKET_INITIAL_PROJECTS_MIN,
    HARD_MARKET_INITIAL_PROJECTS_MAX,
    EASY_MARKET_MIN_PROJECTS,
    HARD_MARKET_MIN_PROJECTS,
    PLAY_ROUNDS_DEFAULT,
    ROUND_DELAY_MS_DEFAULT
} from './constants';

export class GameEngine {
    private state: GameState;
    private roundDelayMs = ROUND_DELAY_MS_DEFAULT; // delay between rounds
    private onStateChange: (() => void) | null = null;
    private onGameEnd: (() => void) | null = null;
    private running = false;
    private phaseTimeout: NodeJS.Timeout | null = null;
    private playRounds = PLAY_ROUNDS_DEFAULT;
    private defaultAreas = AREAS;
    private botInterpreter: BotInterpreter;

    constructor() {
        this.state = this.createInitialState();
        this.botInterpreter = new BotInterpreter();
        this.setPhase('start');
    }

    private createInitialState(): GameState {
        // Limit courses if configured
        let coursesToUse = COURSES;
        if (COURSES_PER_GAME > 0 && COURSES_PER_GAME < COURSES.length) {
            // Shuffle and pick a subset
            coursesToUse = this.shuffle(COURSES).slice(0, COURSES_PER_GAME);
        }
        return {
            round: 1,
            bots: [],
            projects: [],
            courses: [...coursesToUse],
            areas: [...this.defaultAreas],
            maxRounds: this.playRounds, // Use playRounds for maxRounds
            phase: 'start',
            phaseEndsAt: undefined,
            recentEvents: [], // Initialize recentEvents
            currentBotName: undefined,
        };
    }

    registerBot(bot: Partial<Bot>): boolean {
        // Check uniqueness (case-insensitive)
        if (this.state.bots.some(b => b.name.toLowerCase() === (bot.name || '').toLowerCase())) {
            return false;
        }
        // Initialize all required fields
        const newBot: Bot = {
            id: uuidv4(),
            name: bot.name!,
            code: bot.code!,
            money: INITIAL_BOT_MONEY,
            energy: INITIAL_BOT_ENERGY,
            skills: {},
            area: 'education',
            offers: [],
        };
        this.state.bots.push(newBot);
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    removeBot(name: string): boolean {
        const idx = this.state.bots.findIndex(b => b.name.toLowerCase() === name.toLowerCase());
        if (idx === -1) return false;
        this.state.bots.splice(idx, 1);
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    getState(): GameState {
        return this.state;
    }

    setOnStateChange(cb: () => void) {
        this.onStateChange = cb;
    }

    setOnGameEnd(cb: () => void) {
        this.onGameEnd = cb;
    }

    setPhase(phase: 'start' | 'play' | 'end') {
        this.state.phase = phase;

        if (phase === 'start') {
            this.state.round = 0;
            this.state.phaseEndsAt = undefined;
            // Clear any existing timeouts
            if (this.phaseTimeout) {
                clearTimeout(this.phaseTimeout);
                this.phaseTimeout = null;
            }
            // Don't auto-transition - wait for manual start
        } else if (phase === 'play') {
            this.state.round = 1;
            this.state.phaseEndsAt = undefined; // will be set each round
            this.state.maxRounds = this.playRounds; // Sync maxRounds with playRounds
            if (this.phaseTimeout) {
                clearTimeout(this.phaseTimeout);
                this.phaseTimeout = null;
            }
            this.generateInitialProjects();
            this.startGameLoop();
        } else if (phase === 'end') {
            this.state.phaseEndsAt = undefined;
            if (this.phaseTimeout) {
                clearTimeout(this.phaseTimeout);
                this.phaseTimeout = null;
            }
            // Don't auto-reset - wait for manual reset
        }

        if (this.onStateChange) this.onStateChange();
    }

    // Manual start - only start if bots exist
    startGame(): boolean {
        if (this.state.phase !== 'start') {
            return false;
        }
        if (this.state.bots.length === 0) {
            return false;
        }
        this.setPhase('play');
        return true;
    }

    // Manual reset
    resetGame() {
        // Stop any running game
        if (this.phaseTimeout) {
            clearTimeout(this.phaseTimeout);
            this.phaseTimeout = null;
        }
        this.running = false;

        // Clear all state
        this.state = this.createInitialState();
        this.setPhase('start');
    }

    startGameLoop() {
        if (this.running) return;
        this.running = true;
        // Start the first round immediately
        this.scheduleNextRound(0);
    }

    private scheduleNextRound(delayMs: number) {
        if (this.phaseTimeout) {
            clearTimeout(this.phaseTimeout);
            this.phaseTimeout = null;
        }
        this.phaseTimeout = setTimeout(() => {
            this.nextRound().catch(err => {
                console.error('Error in game round:', err);
            });
        }, delayMs);
    }

    private async nextRound() {
        if (this.state.phase !== 'play') return;
        if (this.state.round > this.playRounds || this.state.bots.length === 0) {
            this.endGame();
            return;
        }
        // Randomize bot order
        this.state.bots = this.shuffle(this.state.bots);

        // Execute each bot's code and collect moves
        await this.executeBotMoves();

        // Resolve projects
        this.resolveProjects();

        // Spawn new projects occasionally
        this.maybeSpawnNewProjects();

        // Set phaseEndsAt for UI (when next round will start)
        this.state.phaseEndsAt = Date.now() + this.roundDelayMs;

        // Notify state change before delay
        if (this.onStateChange) this.onStateChange();

        // Advance round counter
        this.state.round++;

        // End game if needed
        if (this.state.round > this.playRounds || this.state.bots.length === 0) {
            this.endGame();
            return;
        }

        // Wait a few seconds before next round for human readability
        this.scheduleNextRound(this.roundDelayMs);
    }

    private async executeBotMoves() {
        for (const bot of this.state.bots) {
            try {
                // Mark the current bot by name in the state
                const stateForBot: GameState = {
                    ...this.state,
                    currentBotName: bot.name
                };

                // Execute bot code
                const action = await this.botInterpreter.run(bot.code, stateForBot, bot.name || bot.id);
                // Process action
                this.processBotAction(bot, action);
            } catch (e: any) {
                // Short, clear error log
                console.warn(`[BotError] ${bot.name}: ${e && e.message ? e.message : e}`);
                // Penalize bot for errors
                bot.energy = Math.max(0, bot.energy - 5);
            }
        }
    }

    private addEvent(type: GameEvent['type'], botName: string, detail: string) {
        // Do not log 'move' events to recentEvents (UI already shows movement)
        if (type === 'move') return;
        this.state.recentEvents.push({type, round: this.state.round, botName, detail});
        if (this.state.recentEvents.length > 30) {
            this.state.recentEvents = this.state.recentEvents.slice(-30);
        }
    }

    private processBotAction(bot: Bot, action: BotAction) {
        if (action.type === 'invalid') {
            // Short, clear invalid action log
            // Do not print bot code or full object
            console.warn(`[BotInvalid] ${bot.name}: ${action.reason}`);
            // Add to recent activity
            this.addEvent('invalid', bot.name, action.reason);
            bot.energy = Math.max(0, bot.energy - INVALID_MOVE_ENERGY_PENALTY);
            return;
        }

        switch (action.type) {
            case 'rest':
                if (bot.area === 'relaxation') {
                    // Pick a random activity
                    const activity = RELAXATION_ACTIVITIES[Math.floor(Math.random() * RELAXATION_ACTIVITIES.length)];
                    // Pick a random energy gain in the range
                    const energyGain = RELAXATION_ENERGY_RANGE.min + Math.floor(Math.random() * (RELAXATION_ENERGY_RANGE.max - RELAXATION_ENERGY_RANGE.min + 1));
                    bot.energy = Math.min(100, bot.energy + energyGain);
                    this.addEvent('rest', bot.name, `${bot.name} enjoyed ${activity} → +${energyGain} energy`);
                }
                break;

            case 'move':
                if (this.defaultAreas.includes(action.area)) {
                    bot.area = action.area;
                    bot.energy = Math.max(0, bot.energy - MOVE_ENERGY_COST);
                    this.addEvent('move', bot.name, `${bot.name} moved to ${action.area}`);
                }
                break;

            case 'study': {
                const course = this.state.courses.find(c => c.id === action.courseId);
                if (!course) {
                    // Invalid course: report invalid move and penalize energy
                    const reason = `${bot.name} tried to study invalid course: '${action.courseId}'`;
                    this.addEvent('invalid', bot.name, reason);
                    bot.energy = Math.max(0, bot.energy - INVALID_MOVE_ENERGY_PENALTY);
                    break;
                }
                if (bot.area !== 'education') {
                    // Not in education area: invalid move
                    const reason = `Tried to study '${course.name}' outside education area`;
                    this.addEvent('invalid', bot.name, reason);
                    bot.energy = Math.max(0, bot.energy - INVALID_MOVE_ENERGY_PENALTY);
                    break;
                }
                // Valid study - apply all skills from the course
                const skillsDescription = Object.entries(course.skillsGained)
                    .map(([skill, level]) => {
                        bot.skills[skill] = (bot.skills[skill] || 0) + level;
                        return `${skill} +${level}`;
                    })
                    .join(', ');
                bot.energy = Math.max(0, bot.energy - course.energyCost);
                this.addEvent('study', bot.name, `${bot.name} completed ${course.name} → ${skillsDescription}`);
                break;
            }

            case 'offer-project':
                const project = this.state.projects.find(p => p.id === action.projectId);
                if (project) {
                    if (bot.area !== project.area) {
                        // Only log bot name and project area, not code
                        console.log(`Bot ${bot.name} tried to offer project in ${project.area} while in ${bot.area}`);
                        break;
                    }
                    if (!project.offers.includes(bot.id)) {
                        project.offers.push(bot.id);
                        bot.offers.push(action.projectId);
                    }
                }
                break;

            case 'chat':
                // Log chat messages as events
                this.addEvent('chat', bot.name, `${bot.name}: "${action.message}"`);
                break;
        }
    }

    private resolveProjects() {
        for (const project of this.state.projects) {
            const offeringBots = this.state.bots.filter(bot => project.offers.includes(bot.id));

            if (offeringBots.length > 0) {
                const combinedSkills: Record<string, number> = {};
                for (const bot of offeringBots) {
                    for (const [skill, level] of Object.entries(bot.skills)) {
                        combinedSkills[skill] = (combinedSkills[skill] || 0) + level;
                    }
                }

                let requirementsMet = true;
                for (const [skill, reqLevel] of Object.entries(project.requiredSkills)) {
                    if ((combinedSkills[skill] || 0) < reqLevel) {
                        requirementsMet = false;
                        break;
                    }
                }

                if (requirementsMet) {
                    const rewardPerBot = Math.floor(project.reward / offeringBots.length);
                    const names = offeringBots.map(b => b.name);
                    for (const bot of offeringBots) {
                        bot.money += rewardPerBot;
                        bot.energy = Math.max(0, bot.energy - PROJECT_SUCCESS_ENERGY_COST);
                    }
                    const eventType: GameEvent['type'] = offeringBots.length > 1 ? 'collab' : 'project';
                    const detail = offeringBots.length > 1
                        ? `${names.join(' & ')} completed collab → $${rewardPerBot} each`
                        : `${names[0]} completed project → +$${rewardPerBot}`;
                    this.addEvent(eventType, names[0], detail);
                    this.state.projects = this.state.projects.filter(p => p.id !== project.id);
                } else {
                    for (const bot of offeringBots) {
                        bot.energy = Math.max(0, bot.energy - PROJECT_FAIL_ENERGY_COST);
                        this.addEvent('fail', bot.name, `${bot.name} failed project (requirements not met)`);
                    }
                }
            }

            if (this.state.projects.includes(project)) {
                // Remove project if expired
                const currentRound = this.state.round;
                if (currentRound >= project.createdAtRound + project.dueAfterRoundsCount) {
                    this.state.projects = this.state.projects.filter(p => p.id !== project.id);
                }
            }

            project.offers = [];
        }

        for (const bot of this.state.bots) {
            bot.offers = [];
        }

        const eliminatedBots = this.state.bots.filter(bot => bot.energy <= 0);
        for (const bot of eliminatedBots) {
            this.addEvent('fail', bot.name, `${bot.name} eliminated (burnout)`);
        }
        this.state.bots = this.state.bots.filter(bot => bot.energy > 0);

        if (eliminatedBots.length > 0) {
            console.log(`${eliminatedBots.length} bot(s) eliminated due to burnout`);
        }
    }

    private endGame() {
        if (this.phaseTimeout) {
            clearTimeout(this.phaseTimeout);
            this.phaseTimeout = null;
        }
        this.running = false;
        this.setPhase('end');
        if (this.onGameEnd) this.onGameEnd();
    }

    private shuffle<T>(arr: T[]): T[] {
        // Fisher-Yates shuffle
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    private generateInitialProjects() {
        // Generate configurable number of projects per area at the start of play phase
        const areas = ['education', 'easy-market', 'hard-market'];
        const skills = SKILLS;
        areas.forEach(area => {
            let numProjects = 3;
            if (area === 'easy-market') {
                numProjects = EASY_MARKET_INITIAL_PROJECTS_MIN + Math.floor(Math.random() * (EASY_MARKET_INITIAL_PROJECTS_MAX - EASY_MARKET_INITIAL_PROJECTS_MIN + 1));
            } else if (area === 'hard-market') {
                numProjects = HARD_MARKET_INITIAL_PROJECTS_MIN + Math.floor(Math.random() * (HARD_MARKET_INITIAL_PROJECTS_MAX - HARD_MARKET_INITIAL_PROJECTS_MIN + 1));
            }
            for (let i = 0; i < numProjects; i++) {
                this.state.projects.push(this.generateProject(area, skills));
            }
        });
    }

    private generateProject(area: string, availableSkills: string[]) {
        const difficulty = area === 'easy-market' ? 'easy' : area === 'hard-market' ? 'hard' : 'medium';
        const numSkills = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;
        const maxLevel = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 5 : 3;

        const requiredSkills: Record<string, number> = {};
        const selectedSkills = this.shuffle(availableSkills).slice(0, numSkills);
        selectedSkills.forEach(skill => {
            requiredSkills[skill] = 1 + Math.floor(Math.random() * maxLevel);
        });

        const baseReward = difficulty === 'easy' ? 50 : difficulty === 'hard' ? 200 : 100;
        const reward = baseReward + Math.floor(Math.random() * 50);

        const dueAfterRoundsCount = 3 + Math.floor(Math.random() * 5); // 3-7 rounds
        return {
            id: uuidv4(),
            area,
            requiredSkills,
            reward,
            createdAtRound: this.state.round,
            dueAfterRoundsCount,
            offers: []
        };
    }

    private maybeSpawnNewProjects() {
        // Maintain at least N projects per area (configurable)
        const areas = ['education', 'easy-market', 'hard-market'];
        const skills = SKILLS;
        areas.forEach(area => {
            const projectsInArea = this.state.projects.filter(p => p.area === area).length;
            let minProjects = 2;
            if (area === 'easy-market') {
                minProjects = EASY_MARKET_MIN_PROJECTS;
            } else if (area === 'hard-market') {
                minProjects = HARD_MARKET_MIN_PROJECTS;
            }
            if (projectsInArea < minProjects && Math.random() < 0.5) {
                this.state.projects.push(this.generateProject(area, skills));
            }
        });
    }

    // Add more game logic methods as needed

    // Replay game: reset all bots' stats but keep them registered
    replayGame() {
        // Reset bot stats and preserve bots
        const resetBots = this.state.bots.map(bot => ({
            ...bot,
            money: INITIAL_BOT_MONEY,
            energy: INITIAL_BOT_ENERGY,
            skills: {},
            area: 'education',
            offers: []
        }));
        // Re-create state using createInitialState, but keep bots
        this.state = this.createInitialState();
        this.state.bots = resetBots;
        this.setPhase('start');
        if (this.onStateChange) this.onStateChange();
    }
}
