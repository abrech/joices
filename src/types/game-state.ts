import type { Stats, StatusType } from './definitions';
import type { EventScreen } from './events';

export type GamePhase =
  | 'classSelect'
  | 'weaponSelect'
  | 'floorChoice'
  | 'event'
  | 'gameOver';

export interface OwnedSkill {
  id: string;
  level: number;
}

export interface PlayerState {
  classId: string;
  weaponId: string;
  hp: number;
  gold: number;
  skills: OwnedSkill[];
  stats: Stats;
  activeSynergyIds: string[];
}

export interface StatusInstance {
  type: StatusType;
  stacks: number;
  duration: number;
}

export interface CombatLogEntry {
  text: string;
  type: 'player' | 'enemy' | 'system' | 'crit';
}

export interface CombatState {
  enemyId: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAttack: number;
  enemyStatuses: StatusInstance[];
  playerStatuses: StatusInstance[];
  turn: 'player' | 'enemy';
  log: CombatLogEntry[];
  skillCooldowns: Record<string, number>;
  playerDodgeNext: boolean;
  enemyTurnCount: number;
  enemyStunned: boolean;
  isBoss: boolean;
  goldReward: number;
  finished: boolean;
  result?: 'win' | 'lose';
}

export interface ActiveEvent {
  eventId: string;
  screen: EventScreen;
  payload: unknown;
  /** Original event payload when screen changes (e.g. combat → loot). */
  eventPayload?: unknown;
}

export interface FloorOption {
  eventId: string;
  name: string;
  description: string;
  imageKey: string;
  preview?: string;
  payload: unknown;
}

export interface RunPacing {
  combatsThisRun: number;
}

export interface RunState {
  floor: number;
  player: PlayerState;
  phase: GamePhase;
  activeEvent?: ActiveEvent;
  combat?: CombatState;
  floorOptions: FloorOption[];
  pacing: RunPacing;
  rngSeed: number;
  rngState: number;
  runGoldEarned: number;
  victory?: boolean;
  newSynergyToast?: string;
}

export interface ProfileState {
  version: number;
  metaCurrency?: number;
  unlockedClassIds?: string[];
  unlockedWeaponIds?: string[];
  permanentUpgrades?: Record<string, number>;
  runHistory?: { floorReached: number; classId: string; victory: boolean }[];
}

export interface GameState {
  run: RunState;
  profile: ProfileState;
}

export const PROFILE_VERSION = 1;

export function createInitialPacing(): RunPacing {
  return { combatsThisRun: 0 };
}

export function createInitialRunState(seed = Date.now()): RunState {
  return {
    floor: 0,
    pacing: createInitialPacing(),
    player: {
      classId: '',
      weaponId: '',
      hp: 0,
      gold: 0,
      skills: [],
      stats: { maxHp: 0, attack: 0, critChance: 0, block: 0, spellPower: 0 },
      activeSynergyIds: [],
    },
    phase: 'classSelect',
    floorOptions: [],
    rngSeed: seed,
    rngState: seed,
    runGoldEarned: 0,
  };
}

export function createEmptyProfile(): ProfileState {
  return { version: PROFILE_VERSION };
}
