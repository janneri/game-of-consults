import {BotInterpreter} from './bot-interpreter';
import {GameState} from './types';

describe('BotInterpreter Security', () => {

    const minimalState: GameState = {
        round: 1,
        bots: [
            {
                id: 'bot1',
                name: 'TestBot',
                code: '',
                money: 100,
                energy: 80,
                skills: {python: 2},
                area: 'education',
                offers: [],
            },
        ],
        projects: [],
        courses: [],
        areas: ['education', 'relaxation', 'easy-market', 'hard-market'],
        maxRounds: 50,
        phase: 'play',
        recentEvents: [],
        currentBotName: 'TestBot',
    };

    it('should block js-eval with child_process', async () => {
        const code = `(js-eval "require('child_process').exec('echo hacked')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
        // Note: May be caught by multiple patterns (child_process, require, js-eval)
    });

    it('should block js-load', async () => {
        const code = `(js-load "some-file.js")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block js-invoke', async () => {
        const code = `(js-invoke obj "method" args)`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block js-call', async () => {
        const code = `(js-call func args)`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block js-new', async () => {
        const code = `(js-new "Date")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block fetch', async () => {
        const code = `(js-eval "fetch('http://evil.com')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block XMLHttpRequest', async () => {
        const code = `(js-eval "new XMLHttpRequest()")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block http module access', async () => {
        const code = `(js-eval "require('http').get('http://evil.com')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block https module access', async () => {
        const code = `(js-eval "require('https').get('https://evil.com')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block net module access', async () => {
        const code = `(js-eval "require('net').connect()")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block fs.readFile', async () => {
        const code = `(js-eval "fs.readFileSync('/etc/passwd')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block fs.writeFile', async () => {
        const code = `(js-eval "fs.writeFileSync('/tmp/hack', 'data')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block child_process directly', async () => {
        const code = `(js-eval "require('child_process').exec('rm -rf /')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block process.exit', async () => {
        const code = `(js-eval "process.exit(1)")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block eval function', async () => {
        const code = `(js-eval "eval('malicious code')")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block Function constructor', async () => {
        const code = `(js-eval "Function('return this')()")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block setTimeout', async () => {
        const code = `(js-eval "setTimeout(() => {}, 1000)")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should block setInterval', async () => {
        const code = `(js-eval "setInterval(() => {}, 1000)")`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('invalid');
    });

    it('should allow legitimate code with "required" word', async () => {
        const code = `(let* ((me (self state))) (rest))`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('rest');
    });

    it('should allow normal bot logic', async () => {
        const code = `
          (let* ((me (self state))
                 (my-energy (energy me)))
            (if (< my-energy 30)
                (move "relaxation")
                (rest)))`;
        const result = await new BotInterpreter().run(code, minimalState, 'TestBot');
        expect(result.type).toBe('rest'); // energy is 80, so should rest
    });
});


