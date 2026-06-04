import type { CombatContext, PassiveContext } from '../game/combat/CombatContext';

export interface Stats {
  maxHp: number;
  attack: number;
  critChance: number;
  block: number;
  spellPower: number;
}

export interface StatModifier {
  stat: keyof Stats;
  flat?: number;
  multiplier?: number;
}

export interface CombatEffectResult {
  damage?: number;
  heal?: number;
  applyStatus?: { target: 'enemy' | 'player'; type: StatusType; stacks?: number; duration?: number };
  extraStatuses?: { target: 'enemy' | 'player'; type: StatusType; stacks?: number; duration?: number }[];
  stun?: boolean;
  dodgeNext?: boolean;
  grantBlock?: number;
  counterOnDodge?: number;
  pierceNext?: boolean;
  aoe?: boolean;
  logMessage?: string;
}

export type StatusType = 'bleed' | 'burn' | 'poison' | 'stun' | 'mark' | 'weaken';

export interface ClassDef {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  baseStats: Stats;
  weaponIds: [string, string];
  starterPassiveId?: string;
  unlockRequirement?: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  classId: string;
  statModifiers: Partial<Stats>;
  tags: string[];
  starterAttackId: string;
  unlockRequirement?: string;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  type: 'attack' | 'passive';
  tags: string[];
  classId?: string;
  weaponId?: string;
  maxLevel: number;
  levelDescriptions: string[];
  baseCooldown?: number;
  onUse?: (ctx: CombatContext, level: number) => CombatEffectResult;
  onPassive?: (ctx: PassiveContext, level: number) => StatModifier[];
  combatStart?: (ctx: CombatContext, level: number) => CombatEffectResult;
}

export type EnemyTier = 'normal' | 'elite';

export interface EnemyDef {
  id: string;
  name: string;
  imageKey: string;
  tags: string[];
  tier: EnemyTier;
  baseStats: Pick<Stats, 'maxHp' | 'attack'>;
  behavior: 'aggressive' | 'defensive' | 'bursty';
  goldDrop: [number, number];
}

export interface ImageDef {
  key: string;
  src: string;
  fallbackColor: string;
}

export interface SynergyDef {
  id: string;
  name: string;
  description: string;
  requiredTags: string[];
  minCount: number;
  effect: (ctx: SynergyEffectContext) => SynergyBonuses;
}

export interface SynergyEffectContext {
  ownedSkillTags: string[];
  skillLevels: Record<string, number>;
}

export interface SynergyBonuses {
  burnMultiplier?: number;
  bleedDoubleTick?: boolean;
  bleedBonusPerStack?: number;
  critBonus?: number;
  spellPowerBonus?: number;
  damageMultiplier?: number;
  poisonMultiplier?: number;
}
