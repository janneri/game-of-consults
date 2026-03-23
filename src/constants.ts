// Centralized constants for skills and areas in Game of Consults
import { Course } from './types';

export const SKILLS = [
  'python',
  'javascript',
  'ml',
  'devops',
  'azure',
  'docker',
  'kubernetes',
];

export const AREAS = [
  'education',
  'relaxation',
  'easy-market',
  'hard-market',
];

// Define available courses
export const COURSES: Course[] = [
  {
    id: 'python-basics',
    name: 'Python Basics',
    skillsGained: { python: 1 },
    energyCost: 5
  },
  {
    id: 'python-advanced',
    name: 'Advanced Python',
    skillsGained: { python: 2 },
    energyCost: 8
  },
  {
    id: 'javascript-fundamentals',
    name: 'JavaScript Fundamentals',
    skillsGained: { javascript: 1 },
    energyCost: 5
  },
  {
    id: 'javascript-advanced',
    name: 'Advanced JavaScript',
    skillsGained: { javascript: 2 },
    energyCost: 8
  },
  {
    id: 'ml-intro',
    name: 'ML Introduction',
    skillsGained: { ml: 1, python: 1 },
    energyCost: 7
  },
  {
    id: 'ml-advanced',
    name: 'Advanced ML',
    skillsGained: { ml: 2, python: 1 },
    energyCost: 10
  },
  {
    id: 'devops-basics',
    name: 'DevOps Basics',
    skillsGained: { devops: 1 },
    energyCost: 5
  },
  {
    id: 'devops-advanced',
    name: 'Advanced DevOps',
    skillsGained: { devops: 2, docker: 1 },
    energyCost: 9
  },
  {
    id: 'azure-cloud',
    name: 'Azure Cloud',
    skillsGained: { azure: 2 },
    energyCost: 6
  },
  {
    id: 'docker-mastery',
    name: 'Docker Mastery',
    skillsGained: { docker: 2, devops: 1 },
    energyCost: 8
  },
  {
    id: 'kubernetes-fundamentals',
    name: 'Kubernetes Fundamentals',
    skillsGained: { kubernetes: 2, docker: 1, devops: 1 },
    energyCost: 12
  },
  {
    id: 'fullstack-bootcamp',
    name: 'Full Stack Bootcamp',
    skillsGained: { python: 1, javascript: 1, azure: 1 },
    energyCost: 10
  }
];

// Game logic constants
export const INVALID_MOVE_ENERGY_PENALTY = 2;
export const REST_ENERGY_GAIN = 20;
export const STUDY_ENERGY_COST = 5;
export const MOVE_ENERGY_COST = 2;
export const PROJECT_FAIL_ENERGY_COST = 3;
export const PROJECT_SUCCESS_ENERGY_COST = 10;
export const INITIAL_BOT_MONEY = 0;
export const INITIAL_BOT_ENERGY = 100;

export const RELAXATION_ACTIVITIES = [
  'beer',
  'music',
  'dancing',
  'karaoke',
  'board games',
  'yoga',
  'meditation',
  'table tennis',
  'coffee',
  'chilling with friends',
];

export const RELAXATION_ENERGY_RANGE = { min: 10, max: 30 };

// --- Game Configuration Constants ---
// Number of courses to show in the game (if you want to limit from all available)
export const COURSES_PER_GAME = 5; // Set to desired number, or COURSES.length for all

// Initial projects per area (min/max, inclusive)
export const EASY_MARKET_INITIAL_PROJECTS_MIN = 3;
export const EASY_MARKET_INITIAL_PROJECTS_MAX = 5;
export const HARD_MARKET_INITIAL_PROJECTS_MIN = 3;
export const HARD_MARKET_INITIAL_PROJECTS_MAX = 5;

// Minimum projects to maintain per area during the game
export const EASY_MARKET_MIN_PROJECTS = 2;
export const HARD_MARKET_MIN_PROJECTS = 2;

// Game round settings
export const PLAY_ROUNDS_DEFAULT = 20;
export const ROUND_DELAY_MS_DEFAULT = 2000;

