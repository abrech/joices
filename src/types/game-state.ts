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

export interface CombatLastAction {
  actor: 'player' | 'enemy';
  kind: 'attack' | 'skill' | 'status' | 'dodge' | 'block' | 'stun';
  damage?: number;
  crit?: boolean;
  charged?: boolean;
  label?: string;
  targetInstanceId?: string;
  aoe?: boolean;
}

export interface CombatEnemyInstance {
  instanceId: string;
  enemyId: string;
  hp: number;
  maxHp: number;
  attack: number;
  statuses: StatusInstance[];
  stunned: boolean;
  turnCount: number;
}

export interface CombatState {
  enemies: CombatEnemyInstance[];
  targetIndex: number;
  playerStatuses: StatusInstance[];
  turn: 'player' | 'enemy';
  /** Index into living enemy order during multi-enemy enemy phase */
  enemyPhaseIndex: number;
  log: CombatLogEntry[];
  skillCooldowns: Record<string, number>;
  currentMana: number;
  playerDodgeNext: boolean;
  playerCounterDamage: number;
  playerBonusBlock: number;
  playerPierceNext: boolean;
  isBoss: boolean;
  goldReward: number;
  finished: boolean;
  result?: 'win' | 'lose';
  lastAction?: CombatLastAction;
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
  /** Floor when skill-training was last completed; -99 if never. */
  lastTrainingFloor: number;
}

export const RUN_LOG_VERSION = 4;
export const MAX_STORED_RUN_LOGS = 30;

export type RunActionPayload =
  | { kind: 'selectClass'; classId: string }
  | { kind: 'selectWeapon'; weaponId: string }
  | { kind: 'pickFloor'; index: number; eventId: string }
  | { kind: 'combatAttack' }
  | { kind: 'combatSkill'; skillId: string }
  | { kind: 'combatEndTurn' }
  | { kind: 'claimLoot' }
  | { kind: 'selectSkill'; skillId: string }
  | { kind: 'skipSkillPick' }
  | { kind: 'buyShop'; itemId: string }
  | { kind: 'leaveShop' }
  | { kind: 'confirmHeal' }
  | { kind: 'combatDefeatContinue' };

export type RunAction = RunActionPayload & {
  seq: number;
  rngStateAfter?: number;
};

export interface RunRecord {
  id: string;
  logVersion: typeof RUN_LOG_VERSION;
  startedAt: number;
  endedAt: number;
  rngSeed: number;
  finalRngState: number;
  classId: string;
  weaponId: string;
  floorReached: number;
  runGoldEarned: number;
  victory: boolean;
  skills: OwnedSkill[];
  actions: RunAction[];
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
  runLogId?: string;
  runStartedAt?: number;
  actionLog?: RunAction[];
}

export interface ProfileState {
  version: number;
  metaCurrency?: number;
  unlockedClassIds?: string[];
  unlockedWeaponIds?: string[];
  permanentUpgrades?: Record<string, number>;
  /** @deprecated Migrated to runLogs on profile v2 */
  runHistory?: { floorReached: number; classId: string; victory: boolean }[];
  runLogs?: RunRecord[];
}

export interface GameState {
  run: RunState;
  profile: ProfileState;
}

export const PROFILE_VERSION = 2;

export function createInitialPacing(): RunPacing {
  return { combatsThisRun: 0, lastTrainingFloor: -99 };
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
      stats: {
        maxHp: 0,
        strength: 0,
        critChance: 0,
        block: 0,
        spell: 0,
        maxMana: 0,
        manaRegen: 0,
      },
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
