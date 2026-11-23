const { BotInterpreter } = require('./dist/bot-interpreter');
const { COURSES } = require('./dist/constants');
const fs = require('node:fs');
const path = require('node:path');

const BOT_NAME = 'BenchBot';
const AREAS = ['education', 'relaxation', 'easy-market', 'hard-market'];

function getCourse(id) {
  const course = COURSES.find(item => item.id === id);
  if (!course) {
    throw new Error(`Unknown course in test bench: ${id}`);
  }
  return course;
}

function createProject(id, area, requiredSkills) {
  return {
    id,
    area,
    requiredSkills,
    reward: 100,
    createdAtRound: 1,
    dueAfterRoundsCount: 5,
    offers: [],
  };
}

const scenarios = [
  {
    title: 'Low energy while relaxing',
    bot: {energy: 12, area: 'relaxation', skills: {}},
    projects: [],
    courses: COURSES,
    goodMoves: ['(rest) — this is where resting restores energy.'],
  },
  {
    title: 'Low energy outside relaxation',
    bot: {energy: 12, area: 'easy-market', skills: {}},
    projects: [],
    courses: COURSES,
    goodMoves: ['(move "relaxation") — then rest to restore energy.'],
  },
  {
    title: 'Qualified for a project in the current area',
    bot: {energy: 85, area: 'easy-market', skills: {python: 2}},
    projects: [createProject('easy-python', 'easy-market', {python: 1})],
    courses: COURSES,
    goodMoves: ['(offer-project "easy-python")'],
  },
  {
    title: 'Missing a skill with a matching course available',
    bot: {energy: 85, area: 'education', skills: {}},
    projects: [createProject('easy-python', 'easy-market', {python: 1})],
    courses: [getCourse('python-basics'), getCourse('azure-cloud')],
    goodMoves: ['(study "python-basics") — it teaches the missing Python skill.'],
  },
  {
    title: 'Missing a skill whose course is not offered this round',
    bot: {energy: 85, area: 'education', skills: {}},
    projects: [createProject('hard-kubernetes', 'hard-market', {kubernetes: 1})],
    courses: [getCourse('azure-cloud')],
    goodMoves: [
      '(study "azure-cloud") — it is available, even though it does not teach Kubernetes.',
      'Do not study a hard-coded course ID that is absent from the course list.',
    ],
  },
  {
    title: 'Qualified for a project in another area',
    bot: {energy: 85, area: 'education', skills: {python: 2}},
    projects: [createProject('easy-python', 'easy-market', {python: 1})],
    courses: COURSES,
    goodMoves: ['(move "easy-market") — then offer the project.'],
  },
];

function createState(code, scenario) {
  const bot = {
    id: 'bench-bot',
    name: BOT_NAME,
    code,
    money: 100,
    energy: scenario.bot.energy,
    skills: scenario.bot.skills,
    area: scenario.bot.area,
    offers: [],
  };

  return {
    round: 3,
    bots: [bot],
    projects: scenario.projects,
    courses: scenario.courses,
    areas: AREAS,
    maxRounds: 20,
    phase: 'play',
    recentEvents: [],
    currentBotName: BOT_NAME,
  };
}

function formatMap(values) {
  const entries = Object.entries(values);
  return entries.length === 0
    ? 'none'
    : entries.map(([name, value]) => `${name} ${value}`).join(', ');
}

function formatAction(action) {
  switch (action.type) {
    case 'rest':
      return '(rest)';
    case 'move':
      return `(move ${JSON.stringify(action.area)})`;
    case 'study':
      return `(study ${JSON.stringify(action.courseId)})`;
    case 'offer-project':
      return `(offer-project ${JSON.stringify(action.projectId)})`;
    case 'chat':
      return `(chat ${JSON.stringify(action.message)})`;
    case 'invalid':
      return `INVALID: ${action.reason}`;
  }
}

function actionProblems(action, state, bot) {
  if (action.type === 'invalid') {
    return [action.reason];
  }
  if (action.type === 'move' && !state.areas.includes(action.area)) {
    return [`Unknown area: ${action.area}`];
  }
  if (action.type === 'study') {
    const course = state.courses.find(item => item.id === action.courseId);
    if (!course) {
      return [`Course is not available in this test state: ${action.courseId}`];
    }
    if (bot.area !== 'education') {
      return [`Cannot study while in ${bot.area}.`];
    }
  }
  if (action.type === 'offer-project') {
    const project = state.projects.find(item => item.id === action.projectId);
    if (!project) {
      return [`Project is not available in this test state: ${action.projectId}`];
    }
    if (bot.area !== project.area) {
      return [`Project is in ${project.area}, but the bot is in ${bot.area}.`];
    }
    const missingSkills = Object.entries(project.requiredSkills)
      .filter(([skill, level]) => (bot.skills[skill] || 0) < level)
      .map(([skill, level]) => `${skill} ${level}`);
    if (missingSkills.length > 0) {
      return [`Missing project skills: ${missingSkills.join(', ')}`];
    }
  }
  return [];
}

function formatCourse(course) {
  const skills = Object.entries(course.skillsGained)
    .map(([skill, level]) => `${skill} +${level}`)
    .join(', ');
  return `${course.id} (${course.name}; ${skills}; energy ${course.energyCost})`;
}

function printSummary(successes, failures) {
  console.log('\nSummary (SUCCESS means the action is applicable, not necessarily optimal):');
  console.log(`  SUCCESS (${successes.length}):`);
  if (successes.length === 0) {
    console.log('    none');
  } else {
    for (const title of successes) {
      console.log(`    - ${title}`);
    }
  }

  console.log(`  FAILED (${failures.length}):`);
  if (failures.length === 0) {
    console.log('    none');
  } else {
    for (const failure of failures) {
      console.log(`    - ${failure.title}: ${failure.problems.join('; ')}`);
    }
  }
}

async function main() {
  const botFile = process.argv[2];
  if (!botFile) {
    console.error('Usage: npm run test:bot -- <bot-file.scm>');
    process.exitCode = 1;
    return;
  }

  const absoluteBotFile = path.resolve(botFile);
  if (!fs.existsSync(absoluteBotFile)) {
    console.error(`Bot file not found: ${botFile}`);
    process.exitCode = 1;
    return;
  }

  const code = fs.readFileSync(absoluteBotFile, 'utf8');
  const interpreter = new BotInterpreter();
  const validation = interpreter.validateCode(code);
  if (!validation.valid) {
    console.error(`FAILED: Invalid Scheme code: ${validation.reason}`);
    printSummary([], [{
      title: 'Scheme validation',
      problems: [validation.reason],
    }]);
    process.exitCode = 1;
    return;
  }

  console.log(`Bot scenario test bench: ${path.relative(process.cwd(), absoluteBotFile)}`);
  const successes = [];
  const failures = [];

  for (const [index, scenario] of scenarios.entries()) {
    const state = createState(code, scenario);
    const bot = state.bots[0];
    const action = await interpreter.run(code, state, BOT_NAME);

    console.log(`\n${index + 1}. ${scenario.title}`);
    console.log(`  State: round ${state.round}/${state.maxRounds}; area ${bot.area}; energy ${bot.energy}/100`);
    console.log(`  Skills: ${formatMap(bot.skills)}`);
    console.log('  Projects:');
    if (state.projects.length === 0) {
      console.log('    none');
    } else {
      for (const project of state.projects) {
        console.log(`    ${project.id} at ${project.area}; needs ${formatMap(project.requiredSkills)}`);
      }
    }
    console.log('  Available courses:');
    if (state.courses.length === 0) {
      console.log('    none');
    } else {
      for (const course of state.courses) {
        console.log(`    ${formatCourse(course)}`);
      }
    }
    console.log('  Possible good moves:');
    for (const move of scenario.goodMoves) {
      console.log(`    - ${move}`);
    }
    console.log(`  Bot response: ${formatAction(action)}`);

    if (action.type === 'rest' && bot.area !== 'relaxation') {
      console.log('  Note: rest does not restore energy outside relaxation.');
    }

    const problems = actionProblems(action, state, bot);
    if (problems.length === 0) {
      successes.push(scenario.title);
      console.log('  Result: SUCCESS');
    } else {
      failures.push({title: scenario.title, problems});
      console.log('  Result: FAILED');
      for (const problem of problems) {
        console.log(`  [WARN] ${problem}`);
      }
    }
  }

  printSummary(successes, failures);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`Test bench failed: ${error.message || error}`);
  process.exitCode = 1;
});
