import {Interpreter} from 'biwascheme';
import {GameState, BotAction} from './types';

export class BotInterpreter {
    // Helper functions code to inject into the environment
    private getHelperFunctions(): string {
        return `
;; Built-in helper functions provided by the game server

;; Player Access Functions
(define (self state)
  "Returns the bot object for the current bot (by name)"
  (define (find-self bots name)
    (cond
      ((null? bots) #f)
      ((string=? name (cdr (assoc 'name (car bots)))) (car bots))
      (else (find-self (cdr bots) name))))
  (find-self (cdr (assoc 'bots state)) (cdr (assoc 'currentBotName state))))

(define (energy bot)
  "Returns the energy level of a bot"
  (cdr (assoc 'energy bot)))

(define (money bot)
  "Returns the money amount of a bot"
  (cdr (assoc 'money bot)))

(define (area bot)
  "Returns the current area of a bot"
  (cdr (assoc 'area bot)))

(define (skill bot skill-name)
  "Returns the skill level for a bot, or 0 if not found"
  (let ((skills (cdr (assoc 'skills bot))))
    (let ((pair (assoc skill-name skills)))
      (if pair (cdr pair) 0))))

;; Action Functions
(define (rest)
  "Returns a rest action"
  '(rest))

(define (move area-name)
  "Returns a move action to the specified area"
  (list 'move area-name))

(define (study course-id)
  "Returns a study action for the specified course"
  (list 'study course-id))

(define (offer-project project-id)
  "Returns an offer-project action"
  (list 'offer-project project-id))

(define (chat message)
  "Returns a chat action."
  (list 'chat message))

;; Game Query Functions
(define (get-projects state)
  "Returns the list of all available projects"
  (cdr (assoc 'projects state)))

(define (get-courses state)
  "Returns the list of all available courses"
  (cdr (assoc 'courses state)))

;; List find: returns the first element in lst for which pred returns #t, or #f
(define (find pred lst)
  (cond
    ((null? lst) #f)
    ((pred (car lst)) (car lst))
    (else (find pred (cdr lst)))))

;; List filter: returns a list of elements for which pred returns #t
(define (filter pred lst)
  (cond
    ((null? lst) '())
    ((pred (car lst)) (cons (car lst) (filter pred (cdr lst))))
    (else (filter pred (cdr lst)))))

;; List sort: sorts a list using a comparison function
(define (sort lst less-than?)
  (if (or (null? lst) (null? (cdr lst)))
      lst
      (let ((pivot (car lst))
            (rest (cdr lst)))
        (append (sort (filter (lambda (x) (less-than? x pivot)) rest) less-than?)
                (list pivot)
                (sort (filter (lambda (x) (not (less-than? x pivot))) rest) less-than?)))))

;; List length
(define (length lst)
  (if (null? lst)
      0
      (+ 1 (length (cdr lst)))))

;; Project accessors
(define (project-area p) (cdr (assoc 'area p)))
(define (project-id p) (cdr (assoc 'id p)))

;; Course accessors
(define (course-id c) (cdr (assoc 'id c)))
(define (course-name c) (cdr (assoc 'name c)))
(define (course-skills c) (cdr (assoc 'skillsGained c)))
(define (course-energy-cost c) (cdr (assoc 'energyCost c)))

;; Aliases
(define (projects state) (get-projects state))
(define (courses state) (get-courses state))

;; Skill check helper
(define (has-enough-skills bot project)
  "Returns #t if bot has all required skills for the project, else #f."
  (let ((bot-skills (cdr (assoc 'skills bot)))
        (reqs (cdr (assoc 'requiredSkills project))))
    (let ((ok #t))
      (for-each (lambda (req)
                  (let* ((skill (car req)) 
                         (level (cdr req))
                         (skill-entry (assoc skill bot-skills))
                         (bot-level (if skill-entry (cdr skill-entry) 0)))
                    (if (< bot-level level)
                        (set! ok #f))))
                reqs)
      ok)))

;; Helper: find a course that teaches a specific skill
(define (find-course-for-skill state skill-name)
  (let ((cs (courses state)))
    (find (lambda (c)
            (let ((skills (course-skills c)))
              (assoc skill-name skills)))
          cs)))

`;
    }

    // Serialize a JS value to a Scheme literal string
    private toSchemeLiteral(value: any): string {
        if (value === null || value === undefined) return '#f';
        if (typeof value === 'boolean') return value ? '#t' : '#f';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
        if (Array.isArray(value)) {
            if (value.length === 0) return "'()";
            // Check if it looks like an alist entry [key, val]
            if (value.length === 2 && typeof value[0] === 'string' && !Array.isArray(value[0])) {
                return `(${value[0]} . ${this.toSchemeLiteral(value[1])})`;
            }
            // Otherwise a proper list
            return `(list ${value.map(v => this.toSchemeLiteral(v)).join(' ')})`;
        }
        return '#f';
    }

    // Serialize the full state as a Scheme (define state ...) expression
    private stateToSchemeDefine(state: GameState): string {
        const botsScheme = state.bots.map(bot => {
            const skillPairs = Object.entries(bot.skills || {})
                .map(([k, v]) => `(${k} . ${v})`).join(' ');
            const offersList = bot.offers.map(o => this.toSchemeLiteral(o)).join(' ');
            return `((id . "${bot.id}") (name . "${bot.name}") (money . ${bot.money}) (energy . ${bot.energy}) (skills . (${skillPairs})) (area . "${bot.area}") (offers . (${offersList})))`;
        });

        const projectsScheme = state.projects.map(proj => {
            const skillPairs = Object.entries(proj.requiredSkills || {})
                .map(([k, v]) => `(${k} . ${v})`).join(' ');
            const offersList = proj.offers.map(o => this.toSchemeLiteral(o)).join(' ');
            // Calculate roundsLeft dynamically
            const roundsLeft = (proj.createdAtRound + proj.dueAfterRoundsCount) - state.round;
            return `((id . "${proj.id}") (area . "${proj.area}") (requiredSkills . (${skillPairs})) (reward . ${proj.reward}) (roundsLeft . ${roundsLeft}) (offers . (${offersList})))`;
        });

        const coursesScheme = state.courses.map(course => {
            const skillPairs = Object.entries(course.skillsGained || {})
                .map(([k, v]) => `(${k} . ${v})`).join(' ');
            return `((id . "${course.id}") (name . "${course.name}") (skillsGained . (${skillPairs})) (energyCost . ${course.energyCost}))`;
        });

        const areasList = state.areas.map(a => `"${a}"`).join(' ');

        // Add currentBotName to the Scheme state if present
        const currentBotNameEntry = state.currentBotName ? `(currentBotName . "${state.currentBotName}") ` : '';

        return `(define state '(${currentBotNameEntry}(round . ${state.round}) (bots . (${botsScheme.join(' ')})) (projects . (${projectsScheme.join(' ')})) (courses . (${coursesScheme.join(' ')})) (areas . (${areasList})) (maxRounds . ${state.maxRounds}) (phase . "${state.phase}")))`;
    }

    // Run bot code with the game state and built-in helpers
    async run(code: string, state: GameState, botNameOrId?: string): Promise<BotAction> {
        try {
            const interpreter = new Interpreter();
            // console.log('[BotInterpreter] Created interpreter');

            // Inject helper functions
            const helpersCode = this.getHelperFunctions();
            // console.log('[BotInterpreter] Injecting helpers');
            await new Promise((resolve, reject) => {
                interpreter.evaluate(helpersCode,
                    () => {
                        resolve(null);
                    },
                    (e: any) => {
                        console.error('[BotInterpreter] Helpers error', e);
                        reject(e);
                    }
                );
            });

            // Inject state as a Scheme define expression
            const stateDefine = this.stateToSchemeDefine(state);
            // console.log('[BotInterpreter] State define code:', stateDefine);
            // console.log('[BotInterpreter] Injecting state');
            await new Promise((resolve, reject) => {
                interpreter.evaluate(stateDefine,
                    () => {
                        // console.log('[BotInterpreter] State injected');
                        resolve(null);
                    },
                    (e: any) => {
                        console.error('[BotInterpreter] State error', e);
                        reject(e);
                    }
                );
            });

            // Execute bot code
            // console.log('[BotInterpreter] Executing bot code:', code);
            const result = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const who = botNameOrId ? `${botNameOrId} timed out after 1s` : 'Timed out after 1s';
                    reject(new Error(who));
                }, 1000);
                interpreter.evaluate(code,
                    (v: any) => {
                        clearTimeout(timeout);
                        // console.log('[BotInterpreter] Code result', v);
                        resolve(v);
                    },
                    (e: any) => {
                        clearTimeout(timeout);
                        console.error('[BotInterpreter] Code error', e);
                        reject(e);
                    }
                );
            });

            // Parse the result
            // console.log('[BotInterpreter] Parsing result');
            return this.parseAction(result);
        } catch (e: any) {
            console.error('[BotInterpreter] Exception', e); // Suppressed to avoid noisy test output
            return {type: 'invalid', reason: e.message || 'Execution error'};
        }
    }

    // Helper to convert BiwaScheme Pair to JS array
    private pairToArray(pair: any): any[] {
        const arr = [];
        while (pair && pair.car !== undefined) {
            arr.push(pair.car);
            pair = pair.cdr;
            if (pair === null || pair === undefined || (typeof pair === 'object' && Object.keys(pair).length === 0)) break;
        }
        return arr;
    }

    // Parse the action(s) returned by the bot code
    private parseAction(result: any): BotAction {
        // Convert BiwaScheme Pair to array if needed
        if (result && typeof result.to_array === 'function') {
            result = result.to_array();
        } else if (result && result.car !== undefined && result.cdr !== undefined) {
            result = this.pairToArray(result);
        }

        // If the result is a list of actions (outer list, not a single action), reject
        if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
            return { type: 'invalid', reason: 'Only one action (including chat) is allowed per turn' };
        }

        // Otherwise, parse a single action
        return this.parseSingleAction(result);
    }

    // Parse a single action (internal helper)
    private parseSingleAction(result: any): BotAction {
        if (!Array.isArray(result) || result.length === 0) {
            // Bot returned a non-action value (e.g. a boolean from a helper call) — default to rest
            return {type: 'rest'};
        }

        let actionType = result[0];
        if (actionType && typeof actionType === 'object' && actionType.name) {
            actionType = actionType.name;
        } else {
            actionType = String(actionType).replace(/^'/, '');
        }

        switch (actionType) {
            case 'rest':
                return {type: 'rest'};

            case 'move':
                if (result.length < 2) {
                    return {type: 'invalid', reason: 'move requires an area argument'};
                }
                return {type: 'move', area: String(result[1])};

            case 'study':
                if (result.length < 2) {
                    return {type: 'invalid', reason: 'study requires a course id argument'};
                }
                return {type: 'study', courseId: String(result[1])};

            case 'offer-project':
                if (result.length < 2) {
                    return {type: 'invalid', reason: 'offer-project requires a project id argument'};
                }
                return {type: 'offer-project', projectId: result[1]};

            case 'chat':
                if (result.length < 2) {
                    return {type: 'invalid', reason: 'chat requires a message argument'};
                }
                return {type: 'chat', message: String(result[1])};

            default:
                return {type: 'invalid', reason: `Unknown action type: ${actionType}`};
        }
    }
}
