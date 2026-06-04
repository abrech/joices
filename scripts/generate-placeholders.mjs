import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'public', 'assets');

const items = [
  { path: 'classes/warrior.svg', label: 'Warrior', color: '#8B4513' },
  { path: 'classes/mage.svg', label: 'Mage', color: '#4169E1' },
  { path: 'classes/rogue.svg', label: 'Rogue', color: '#2F4F4F' },
  { path: 'weapons/longsword.svg', label: 'Sword', color: '#C0C0C0' },
  { path: 'weapons/warhammer.svg', label: 'Hammer', color: '#696969' },
  { path: 'weapons/arcane-staff.svg', label: 'Staff', color: '#9370DB' },
  { path: 'weapons/focus-wand.svg', label: 'Wand', color: '#BA55D3' },
  { path: 'weapons/twin-daggers.svg', label: 'Daggers', color: '#708090' },
  { path: 'weapons/hand-crossbow.svg', label: 'Crossbow', color: '#556B2F' },
  { path: 'skills/power-strike.svg', label: 'Strike', color: '#DC143C' },
  { path: 'skills/fireball.svg', label: 'Fireball', color: '#FF4500' },
  { path: 'skills/shadow-step.svg', label: 'Shadow', color: '#483D8B' },
  { path: 'skills/poison-dart.svg', label: 'Poison', color: '#228B22' },
  { path: 'skills/shield-bash.svg', label: 'Bash', color: '#4682B4' },
  { path: 'skills/thick-skin.svg', label: 'ThickSkin', color: '#8B7355' },
  { path: 'skills/keen-eye.svg', label: 'KeenEye', color: '#FFD700' },
  { path: 'skills/burning-aura.svg', label: 'BurnAura', color: '#FF6347' },
  { path: 'skills/hemophilia.svg', label: 'Hemophil', color: '#8B0000' },
  { path: 'skills/arcane-battery.svg', label: 'Battery', color: '#00CED1' },
  { path: 'enemies/goblin.svg', label: 'Goblin', color: '#6B8E23' },
  { path: 'enemies/skeleton.svg', label: 'Skeleton', color: '#D3D3D3' },
  { path: 'enemies/slime.svg', label: 'Slime', color: '#32CD32' },
  { path: 'enemies/bandit.svg', label: 'Bandit', color: '#A0522D' },
  { path: 'enemies/fire-elemental.svg', label: 'FireElem', color: '#FF8C00' },
  { path: 'enemies/assassin.svg', label: 'Assassin', color: '#2F2F2F' },
  { path: 'enemies/armored-knight.svg', label: 'Knight', color: '#778899' },
  { path: 'enemies/wraith.svg', label: 'Wraith', color: '#9370DB' },
  { path: 'enemies/lich.svg', label: 'Lich', color: '#4B0082' },
  { path: 'events/enemy.svg', label: 'Fight', color: '#e94560' },
  { path: 'events/heal.svg', label: 'Heal', color: '#4ecca3' },
  { path: 'events/shop.svg', label: 'Shop', color: '#f0a500' },
  { path: 'events/skill.svg', label: 'Skill', color: '#4169E1' },
  { path: 'events/boss.svg', label: 'Boss', color: '#8B0000' },
  { path: 'ui/gold.svg', label: 'Gold', color: '#FFD700' },
  { path: 'ui/heart.svg', label: 'HP', color: '#e94560' },
  { path: 'ui/floor.svg', label: 'Floor', color: '#a0a0b0' },
];

function svg(label, color) {
  const short = label.slice(0, 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${color}" rx="4"/>
  <rect x="8" y="8" width="48" height="48" fill="rgba(0,0,0,0.25)" rx="2"/>
  <text x="32" y="36" text-anchor="middle" fill="white" font-family="sans-serif" font-size="9" font-weight="bold">${short}</text>
</svg>`;
}

for (const item of items) {
  const fullPath = join(root, item.path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, svg(item.label, item.color));
}

console.log(`Generated ${items.length} placeholder SVGs`);
