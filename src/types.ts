// Shared types for Game of Consults

export interface Bot {
  id: string;
  name: string;
  code: string;
  money: number;
  energy: number;
  skills: Record<string, number>;
  area: string;
  offers: (string | number)[];
}

export interface Course {
  id: string;
  name: string;
  skillsGained: Record<string, number>; // Skills and levels gained from completing this course
  energyCost: number;
}

export interface Project {
  id: string | number;
  area: string;
  requiredSkills: Record<string, number>;
  reward: number;
  createdAtRound: number;
  dueAfterRoundsCount: number;
  offers: (string | number)[];
}

export type GamePhase = 'start' | 'play' | 'end';

export type GameEventType = 'move' | 'study' | 'rest' | 'project' | 'collab' | 'fail' | 'invalid' | 'chat';

export type BotAction =
  | { type: 'rest' }
  | { type: 'move'; area: string }
  | { type: 'study'; courseId: string }
  | { type: 'offer-project'; projectId: string | number }
  | { type: 'chat'; message: string }
  | { type: 'invalid'; reason: string };
// Only a single action (including chat) is allowed per turn.

export interface GameEvent {
  type: GameEventType;
  round: number;
  botName: string;
  detail: string;
}

export interface GameState {
  round: number;
  bots: Bot[];
  projects: Project[];
  courses: Course[];
  areas: string[];
  maxRounds: number;
  phase: GamePhase;
  phaseEndsAt?: number;
  recentEvents: GameEvent[];
  currentBotName?: string;
}
