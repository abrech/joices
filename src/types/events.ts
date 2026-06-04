import type { Stats } from './definitions';
import type { GameState, RunState } from './game-state';
import type { SkillDef } from './definitions';

export type EventScreen = 'combat' | 'shop' | 'skillPick' | 'heal' | 'loot' | 'custom';

export type SkillPoolFilter = (skill: SkillDef, ctx: FloorContext) => boolean;

export interface FloorContext {
  run: RunState;
  profile: GameState['profile'];
  floor: number;
  rng: () => number;
}

export interface EventContext {
  run: RunState;
  profile: GameState['profile'];
  payload: unknown;
  playerChoice?: string;
  combatResult?: 'win' | 'lose';
}

export interface EventOffer {
  eventId: string;
  payload: unknown;
}

export interface SkillPickPayload {
  label: string;
  skills: string[];
  allowSkip?: boolean;
  afterCombatLoot?: boolean;
}

export interface ShopPayload {
  items: ShopItem[];
}

export interface ShopItem {
  id: string;
  type: 'skill' | 'heal' | 'stat';
  name: string;
  description: string;
  price: number;
  skillId?: string;
  stat?: keyof Stats;
  statDelta?: number;
  healPercent?: number;
}

export interface HealPayload {
  healAmount: number;
  label: string;
}

export interface CombatPayload {
  enemyId: string;
  enemyIds: string[];
  isBoss?: boolean;
  isElite?: boolean;
}

export interface LootItem {
  type: 'gold' | 'skill' | 'heal' | 'stat';
  name: string;
  description?: string;
  imageKey?: string;
  amount?: number;
  skillId?: string;
  stat?: keyof Stats;
  statDelta?: number;
}

export interface LootPayload {
  enemyId: string;
  enemyName: string;
  imageKey: string;
  isElite?: boolean;
  isBoss?: boolean;
  items: LootItem[];
  skillChoices?: string[];
}

export type GameEffect =
  | { type: 'damage'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'addSkill'; skillId: string; level?: number }
  | { type: 'upgradeSkill'; skillId: string }
  | { type: 'addGold'; amount: number }
  | { type: 'modifyStat'; stat: keyof Stats; delta: number }
  | { type: 'startCombat'; enemyIds: string[]; isBoss?: boolean }
  | { type: 'advanceFloor' }
  | { type: 'endRun'; victory: boolean }
  | { type: 'custom'; handlerId: string; payload: unknown };

export interface EventDef {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  tags: string[];
  canAppear?: (ctx: FloorContext) => boolean;
  weight?: number | ((ctx: FloorContext) => number);
  buildPayload?: (ctx: FloorContext) => unknown;
  buildOfferPreview?: (ctx: FloorContext, payload: unknown) => string;
  screen: EventScreen;
  resolve: (ctx: EventContext) => GameEffect[];
}
