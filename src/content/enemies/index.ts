import type { EnemyDef } from '../../types/definitions';

export const goblin: EnemyDef = {
  id: 'goblin',
  name: 'Goblin',
  imageKey: 'goblin',
  tags: ['goblin'],
  tier: 'normal',
  baseStats: { maxHp: 30, attack: 6 },
  behavior: 'aggressive',
  goldDrop: [5, 10],
};

export const skeleton: EnemyDef = {
  id: 'skeleton',
  name: 'Skeleton',
  imageKey: 'skeleton',
  tags: ['undead'],
  tier: 'normal',
  baseStats: { maxHp: 40, attack: 8 },
  behavior: 'defensive',
  goldDrop: [8, 14],
};

export const slime: EnemyDef = {
  id: 'slime',
  name: 'Slime',
  imageKey: 'slime',
  tags: ['beast'],
  tier: 'normal',
  baseStats: { maxHp: 50, attack: 5 },
  behavior: 'defensive',
  goldDrop: [6, 12],
};

export const bandit: EnemyDef = {
  id: 'bandit',
  name: 'Bandit',
  imageKey: 'bandit',
  tags: ['human'],
  tier: 'normal',
  baseStats: { maxHp: 45, attack: 10 },
  behavior: 'aggressive',
  goldDrop: [12, 20],
};

export const fireElemental: EnemyDef = {
  id: 'fire-elemental',
  name: 'Fire Elemental',
  imageKey: 'fire-elemental',
  tags: ['fire', 'elemental'],
  tier: 'elite',
  baseStats: { maxHp: 55, attack: 12 },
  behavior: 'bursty',
  goldDrop: [15, 25],
};

export const assassin: EnemyDef = {
  id: 'assassin',
  name: 'Assassin',
  imageKey: 'assassin',
  tags: ['human'],
  tier: 'elite',
  baseStats: { maxHp: 35, attack: 14 },
  behavior: 'bursty',
  goldDrop: [18, 28],
};

export const armoredKnight: EnemyDef = {
  id: 'armored-knight',
  name: 'Armored Knight',
  imageKey: 'armored-knight',
  tags: ['human', 'armored'],
  tier: 'elite',
  baseStats: { maxHp: 80, attack: 9 },
  behavior: 'defensive',
  goldDrop: [20, 30],
};

export const wraith: EnemyDef = {
  id: 'wraith',
  name: 'Wraith',
  imageKey: 'wraith',
  tags: ['undead'],
  tier: 'elite',
  baseStats: { maxHp: 60, attack: 11 },
  behavior: 'aggressive',
  goldDrop: [22, 35],
};

export const lich: EnemyDef = {
  id: 'lich',
  name: 'Lich',
  imageKey: 'lich',
  tags: ['undead', 'boss'],
  tier: 'elite',
  baseStats: { maxHp: 115, attack: 13 },
  behavior: 'bursty',
  goldDrop: [50, 80],
};

export const regularEnemies = [
  goblin,
  skeleton,
  slime,
  bandit,
  fireElemental,
  assassin,
  armoredKnight,
  wraith,
];

export const allEnemies = [...regularEnemies, lich];
