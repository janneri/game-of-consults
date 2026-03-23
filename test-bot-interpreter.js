const { BotInterpreter } = require('./dist/bot-interpreter');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

(async () => {
  const minimalState = {
    round: 1,
    bots: [
      {
        id: 'bot1',
        name: 'Test',
        code: '',
        money: 100,
        energy: 80,
        skills: { python: 2 },
        area: 'education',
        offers: [],
      },
    ],
    projects: [
      {
        id: 'p1',
        area: 'education',
        requiredSkills: { python: 1 },
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
        skillsGained: { python: 1 },
        energyCost: 5
      },
      {
        id: 'ml-intro',
        name: 'ML Introduction',
        skillsGained: { ml: 1, python: 1 },
        energyCost: 7
      }
    ],
    areas: ['education', 'relaxation', 'easy-market', 'hard-market'],
    maxRounds: 50,
    phase: 'play',
    recentEvents: [],
    currentBotName: 'Test',
  };

  // If a filename is given, test only that file
  if (process.argv.length > 2) {
    const botFile = process.argv[2];
    const code = fs.readFileSync(path.resolve(botFile), 'utf8');
    console.log(`Testing bot file: ${botFile}`);
    setTimeout(() => {
      console.error('Script timed out after 5s');
      process.exit(2);
    }, 5000);
    try {
      const result = await new BotInterpreter().run(code, minimalState);
      console.log('Bot action result:', result);
      process.exit(0);
    } catch (e) {
      console.error('Bot error:', e);
      process.exit(1);
    }
  }

  // Otherwise, test all bots/*.scm files
  const botFiles = glob.sync('bots/*.scm');
  if (botFiles.length === 0) {
    console.error('No bot files found in bots/*.scm');
    process.exit(1);
  }
  console.log(`Testing all bot files in bots/*.scm (${botFiles.length} found)`);
  let failures = 0;
  for (const botFile of botFiles) {
    const code = fs.readFileSync(path.resolve(botFile), 'utf8');
    process.stdout.write(`Testing ${botFile} ... `);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      console.error(`TIMEOUT`);
      failures++;
    }, 5000);
    try {
      const result = await new BotInterpreter().run(code, minimalState);
      clearTimeout(timeout);
      if (timedOut) continue;
      if (result.type === 'invalid') {
        console.log(`FAIL: ${JSON.stringify(result)}`);
        failures++;
      } else {
        console.log(`OK: ${JSON.stringify(result)}`);
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log(`ERROR: ${e && e.message ? e.message : e}`);
      failures++;
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} bot(s) failed.`);
    process.exit(1);
  } else {
    console.log('\nAll bots passed.');
    process.exit(0);
  }
})();
