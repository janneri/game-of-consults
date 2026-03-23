import {BotInterpreter} from './bot-interpreter';
import {GameState} from './types';

describe('BotInterpreter', () => {

    const minimalState: GameState = {
        round: 1,
        bots: [
            {
                id: 'bot1',
                name: 'Test',
                code: '',
                money: 100,
                energy: 80,
                skills: {python: 2},
                area: 'education',
                offers: [],
            },
        ],
        projects: [
            {
                id: 'p1',
                area: 'education',
                requiredSkills: {python: 1},
                reward: 80,
                createdAtRound: 1,
                dueAfterRoundsCount: 5,
                offers: [],
            },
        ],
        courses: [
            {
                id: 'python-basics',
                name: 'Python Basics',
                skillsGained: {python: 1},
                energyCost: 5
            },
            {
                id: 'python-advanced',
                name: 'Advanced Python',
                skillsGained: {python: 2},
                energyCost: 8
            },
            {
                id: 'ml-intro',
                name: 'ML Introduction',
                skillsGained: {ml: 1, python: 1},
                energyCost: 7
            },
            {
                id: 'devops-basics',
                name: 'DevOps Basics',
                skillsGained: {devops: 1},
                energyCost: 5
            },
        ],
        areas: ['education', 'relaxation', 'easy-market', 'hard-market'],
        maxRounds: 50,
        phase: 'play',
        recentEvents: [],
        currentBotName: 'Test',
    };


    it('should rest when energy is low', async () => {
        const code = `
          (let* ((me (self state))
                 (my-energy (energy me))
                 (my-area (area me)))
            (if (< my-energy 30)
                (if (eq? my-area "relaxation")
                    (rest)
                    (move "relaxation"))
                (chat "foo")))`;
         const state = {...minimalState, bots: [{...minimalState.bots[0], energy: 10, area: 'relaxation'}], currentBotName: 'Test'};
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'rest'});
    });

    it('should study python course', async () => {
        const code = `
          (let* ((me (self state))
                 (python-level (skill me "python"))
                 (my-area (area me)))
            (if (< python-level 3)
                (if (eq? my-area "education")
                    (study "python-basics")
                    (move "education"))
                (rest)))`;
         const state = {...minimalState, bots: [{...minimalState.bots[0], skills: {python: 2}, area: 'education'}], currentBotName: 'Test'};
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'study', courseId: 'python-basics'});
    });

    it('should move to education', async () => {
        const code = `
          (let* ((me (self state))
                 (python-level (skill me "python"))
                 (my-area (area me)))
            (if (< python-level 3)
                (if (eq? my-area "education")
                    (study "python-basics")
                    (move "education"))
                (rest)))`;
         const state = {...minimalState, bots: [{...minimalState.bots[0], skills: {python: 2}, area: 'relaxation'}], currentBotName: 'Test'};
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'move', area: 'education'});
    });

    it('should offer a project in easy-market if present and has enough skills', async () => {
        const code = `
          (let* ((me (self state))
                 (my-area (area me)))
            (if (eq? my-area "easy-market")
                (let ((proj (find (lambda (p)
                                    (and (eq? (project-area p) "easy-market")
                                         (has-enough-skills me p)))
                                  (projects state))))
                  (if proj
                      (offer-project (project-id proj))
                      (rest)))
                (move "easy-market")))`;
        const state = {
            ...minimalState,
            bots: [{...minimalState.bots[0], area: 'easy-market', skills: {python: 2}}],
            projects: [
                ...minimalState.projects,
                {
                    id: 'p2',
                    area: 'easy-market',
                    requiredSkills: {python: 2},
                    reward: 60,
                    createdAtRound: 1,
                    dueAfterRoundsCount: 4,
                    offers: []
                },
            ],
        };
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'offer-project', projectId: 'p2'});
    });

    it('should chat if energy is exactly 42 (sample-bot logic)', async () => {
        const code = `
          (let* ((me (self state))
                 (my-energy (energy me)))
            (if (= my-energy 42)
                (chat "I have the answer!")
                (rest)))`;
        const state = {...minimalState, bots: [{...minimalState.bots[0], energy: 42}]};
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'chat', message: 'I have the answer!'});
    });

    it('should rest if no suitable project is found', async () => {
        const code = `
          (let* ((me (self state))
                 (my-area (area me)))
            (let ((proj (find (lambda (p)
                                (and (eq? (project-area p) my-area)
                                     (has-enough-skills me p)))
                              (projects state))))
              (if proj
                  (offer-project (project-id proj))
                  (rest))))`;
        const state = {...minimalState, bots: [{...minimalState.bots[0], area: 'education', skills: {python: 0}}]};
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'rest'});
    });

    it('should return a rest action', async () => {
        const code = '(rest)';
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result).toEqual({type: 'rest'});
    });

    it('should return a move action', async () => {
        const code = '(move "relaxation")';
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result).toEqual({type: 'move', area: 'relaxation'});
    });

    it('should return a study action', async () => {
        const code = '(study "python-basics")';
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result).toEqual({type: 'study', courseId: 'python-basics'});
    });

    it('should return an offer-project action', async () => {
        const code = '(offer-project "p1")';
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result).toEqual({type: 'offer-project', projectId: 'p1'});
    });

    it('should return invalid for unknown action', async () => {
        const code = '(foobar)';
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result.type).toBe('invalid');
    });

    function withBotState(overrides: Partial<typeof minimalState.bots[0]> = {}, projectOverrides?: any[]) {
        return {
            ...minimalState,
            bots: [{...minimalState.bots[0], ...overrides}],
            projects: projectOverrides !== undefined ? projectOverrides : minimalState.projects,
        };
    }

    it('should rest if no projects are available (fallback)', async () => {
        const code = `
      (let* ((me (self state))
             (my-area (area me)))
        (let ((proj (find (lambda (p)
                            (and (eq? (project-area p) my-area)
                                 (has-enough-skills me p)))
                          (projects state))))
          (if proj
              (offer-project (project-id proj))
              (rest))))`;
        const state = withBotState({area: 'education', skills: {python: 2}}, []);
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'rest'});
    });

    it('should rest if energy < 60 (conservative-bot logic)', async () => {
        const code = `
      (let* ((me (self state))
             (my-energy (energy me))
             (my-area (area me)))
        (if (< my-energy 60)
            (if (eq? my-area "relaxation")
                (rest)
                (move "relaxation"))
            (rest)))`;
        const state = withBotState({energy: 50, area: 'relaxation'});
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'rest'});
    });

    it('should study devops if devops < 2 (aggressive-bot logic)', async () => {
        const code = `
      (let* ((me (self state))
             (devops-level (skill me "devops"))
             (my-area (area me)))
        (if (< devops-level 2)
            (if (eq? my-area "education")
                (study "devops-basics")
                (move "education"))
            (rest)))`;
        const state = withBotState({area: 'education', skills: {python: 4, ml: 3, devops: 1}});
        const result = await new BotInterpreter().run(code, state, 'Test');
        expect(result).toEqual({type: 'study', courseId: 'devops-basics'});
    });

    it('should return invalid for malformed Scheme code', async () => {
        const code = '(let* ((me (self state)) (rest)'; // missing closing paren
        const result = await new BotInterpreter().run(code, minimalState, 'Test');
        expect(result.type).toBe('invalid');
    });

    it('should handle project evaluation when bot lacks required skills (timeout bug reproduction)', async () => {
        // This test reproduces the bug where has-enough-skills causes infinite loop
        // when checking for skills the bot doesn't have (e.g., java when bot only has python)
        const code = `
          (let* ((me (self state))
                 (my-area (area me)))
            (if (string=? my-area "easy-market")
                (let ((proj (find (lambda (p)
                                    (and (string=? (project-area p) "easy-market")
                                         (has-enough-skills me p)))
                                  (projects state))))
                  (if proj
                      (offer-project (project-id proj))
                      (rest)))
                (move "easy-market")))`;
        const state = {
            ...minimalState,
            bots: [{...minimalState.bots[0], area: 'easy-market', skills: {python: 2}, money: 30}],
            projects: [
                {
                    id: 'p1',
                    area: 'easy-market',
                    requiredSkills: {java: 1}, // Bot doesn't have java skill
                    reward: 60,
                    createdAtRound: 1,
                    dueAfterRoundsCount: 4,
                    offers: []
                },
            ],
        };
        // This should complete without timing out
        const result = await new BotInterpreter().run(code, state, 'Test');
        // Should rest since no suitable project found
        expect(result).toEqual({type: 'rest'});
    });

});
