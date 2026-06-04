import type { ImageDef } from '../types/definitions';

const images: ImageDef[] = [
  { key: 'warrior', src: '/assets/classes/warrior.svg', fallbackColor: '#8B4513' },
  { key: 'mage', src: '/assets/classes/mage.svg', fallbackColor: '#4169E1' },
  { key: 'rogue', src: '/assets/classes/rogue.svg', fallbackColor: '#2F4F4F' },
  { key: 'longsword', src: '/assets/weapons/longsword.svg', fallbackColor: '#C0C0C0' },
  { key: 'warhammer', src: '/assets/weapons/warhammer.svg', fallbackColor: '#696969' },
  { key: 'arcane-staff', src: '/assets/weapons/arcane-staff.svg', fallbackColor: '#9370DB' },
  { key: 'focus-wand', src: '/assets/weapons/focus-wand.svg', fallbackColor: '#BA55D3' },
  { key: 'twin-daggers', src: '/assets/weapons/twin-daggers.svg', fallbackColor: '#708090' },
  { key: 'hand-crossbow', src: '/assets/weapons/hand-crossbow.svg', fallbackColor: '#556B2F' },
  { key: 'power-strike', src: '/assets/skills/power-strike.svg', fallbackColor: '#DC143C' },
  { key: 'fireball', src: '/assets/skills/fireball.svg', fallbackColor: '#FF4500' },
  { key: 'shadow-step', src: '/assets/skills/shadow-step.svg', fallbackColor: '#483D8B' },
  { key: 'poison-dart', src: '/assets/skills/poison-dart.svg', fallbackColor: '#228B22' },
  { key: 'shield-bash', src: '/assets/skills/shield-bash.svg', fallbackColor: '#4682B4' },
  { key: 'thick-skin', src: '/assets/skills/thick-skin.svg', fallbackColor: '#8B7355' },
  { key: 'keen-eye', src: '/assets/skills/keen-eye.svg', fallbackColor: '#FFD700' },
  { key: 'burning-aura', src: '/assets/skills/burning-aura.svg', fallbackColor: '#FF6347' },
  { key: 'hemophilia', src: '/assets/skills/hemophilia.svg', fallbackColor: '#8B0000' },
  { key: 'arcane-battery', src: '/assets/skills/arcane-battery.svg', fallbackColor: '#00CED1' },
  { key: 'goblin', src: '/assets/enemies/goblin.svg', fallbackColor: '#6B8E23' },
  { key: 'skeleton', src: '/assets/enemies/skeleton.svg', fallbackColor: '#D3D3D3' },
  { key: 'slime', src: '/assets/enemies/slime.svg', fallbackColor: '#32CD32' },
  { key: 'bandit', src: '/assets/enemies/bandit.svg', fallbackColor: '#A0522D' },
  { key: 'fire-elemental', src: '/assets/enemies/fire-elemental.svg', fallbackColor: '#FF8C00' },
  { key: 'assassin', src: '/assets/enemies/assassin.svg', fallbackColor: '#2F2F2F' },
  { key: 'armored-knight', src: '/assets/enemies/armored-knight.svg', fallbackColor: '#778899' },
  { key: 'wraith', src: '/assets/enemies/wraith.svg', fallbackColor: '#9370DB' },
  { key: 'lich', src: '/assets/enemies/lich.svg', fallbackColor: '#4B0082' },
  { key: 'enemy', src: '/assets/events/enemy.svg', fallbackColor: '#e94560' },
  { key: 'heal', src: '/assets/events/heal.svg', fallbackColor: '#4ecca3' },
  { key: 'shop', src: '/assets/events/shop.svg', fallbackColor: '#f0a500' },
  { key: 'skill', src: '/assets/events/skill.svg', fallbackColor: '#4169E1' },
  { key: 'boss', src: '/assets/events/boss.svg', fallbackColor: '#8B0000' },
  { key: 'gold', src: '/assets/ui/gold.svg', fallbackColor: '#FFD700' },
  { key: 'heart', src: '/assets/ui/heart.svg', fallbackColor: '#e94560' },
  { key: 'floor', src: '/assets/ui/floor.svg', fallbackColor: '#a0a0b0' },
];

const map = new Map(images.map((i) => [i.key, i]));

export function getImage(key: string): ImageDef {
  return map.get(key) ?? { key, src: '', fallbackColor: '#444' };
}

export function getImageSrc(key: string): string {
  return getImage(key).src;
}

export function getFallbackColor(key: string): string {
  return getImage(key).fallbackColor;
}
