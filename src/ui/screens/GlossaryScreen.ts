import type { Stats } from '../../types/definitions';
import {
  getAllClasses,
  getAllEnemies,
  getAllEvents,
  getAllSkills,
  getAllSynergies,
  getAllWeapons,
  getSkill,
} from '../../content/registries';
import {
  SHOP_HEAL_ITEM,
  SHOP_SKILL_BASE_PRICE,
  SHOP_STAT_ITEMS,
} from '../../content/shop/catalog';
import {
  WEIGHT_ENEMY,
  WEIGHT_HEAL,
  WEIGHT_SHOP,
  WEIGHT_SKILL,
} from '../../game/progression/EncounterWeights';
import { getSkillCooldown } from '../../game/systems/SkillSystem';
import { GlossaryEntry } from '../components/GlossaryEntry';

const EVENT_WEIGHTS: Record<string, number> = {
  'skill-training': WEIGHT_SKILL,
  enemy: WEIGHT_ENEMY,
  shop: WEIGHT_SHOP,
  heal: WEIGHT_HEAL,
  boss: 100,
};

const EVENT_APPEARANCE: Record<string, string> = {
  enemy: 'Most floors; forced on floor 1 first combat. Not on boss floors.',
  'skill-training': 'Floor 2+, not boss floors. Requires learnable or upgradeable skill.',
  shop: 'Floor 2+, not boss floors.',
  heal: 'Floor 2+, not boss floors. Only when below max HP.',
  boss: 'Boss floors only (10, 15, 20, …). Always fights the Lich.',
};

const STATUS_GLOSSARY = [
  {
    title: 'Bleed',
    description: 'Damage over time on the enemy. Stacks increase tick damage.',
    tags: ['debuff'],
  },
  {
    title: 'Burn',
    description: 'Fire damage over time. Inferno synergy increases burn damage.',
    tags: ['debuff', 'fire'],
  },
  {
    title: 'Poison',
    description: 'Damage over time that stacks on the enemy.',
    tags: ['debuff', 'poison'],
  },
  {
    title: 'Mark',
    description: 'Marked foes take 50% increased poison damage while the mark lasts.',
    tags: ['debuff', 'poison'],
  },
  {
    title: 'Weaken',
    description: 'Weakened enemies deal less damage on their attacks (15% per stack, up to 30%).',
    tags: ['debuff'],
  },
  {
    title: 'Stun',
    description: 'Enemy skips their next turn.',
    tags: ['debuff'],
  },
];

const LOOT_GLOSSARY = [
  {
    title: 'Victory bonus rewards',
    description: 'Extra reward after combat (normal 28%, elite 42%, boss always).',
    details: ['Heal 40% · Skill pick 35% · Stat trinket 25% of bonus rolls'],
  },
  {
    title: 'Combat skill loot',
    description: 'When bonus grants a skill, choose 1 of 2 learnable attacks or passives.',
  },
];

function formatStatMods(mods: Partial<Stats>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(mods)) {
    if (val === undefined || val === 0) continue;
    const label = key === 'maxHp' ? 'Max HP' : key === 'critChance' ? 'Crit' : key;
    const suffix = key === 'critChance' ? '%' : '';
    const sign = val > 0 ? '+' : '';
    parts.push(`${sign}${val}${suffix} ${label}`);
  }
  return parts.join(', ') || '—';
}

function glossarySection(id: string, title: string, intro?: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'glossary-section';
  section.id = `glossary-${id}`;
  section.dataset.glossarySection = id;

  const heading = document.createElement('h2');
  heading.className = 'glossary-section__title';
  heading.textContent = title;
  section.appendChild(heading);

  if (intro) {
    const p = document.createElement('p');
    p.className = 'glossary-section__intro';
    p.textContent = intro;
    section.appendChild(p);
  }

  return section;
}

function glossaryGrid(): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'glossary-grid';
  return grid;
}

function groupTitle(text: string): HTMLElement {
  const h = document.createElement('h3');
  h.className = 'glossary-section__group-title';
  h.textContent = text;
  return h;
}

function applyGlossaryFilter(root: HTMLElement, query: string): void {
  const q = query.trim().toLowerCase();
  const entries = root.querySelectorAll<HTMLElement>('.glossary-entry');
  for (const entry of entries) {
    const text = entry.textContent?.toLowerCase() ?? '';
    entry.classList.toggle('glossary-entry--hidden', q.length > 0 && !text.includes(q));
  }

  const sections = root.querySelectorAll<HTMLElement>('.glossary-section');
  for (const section of sections) {
    const visible = section.querySelectorAll('.glossary-entry:not(.glossary-entry--hidden)');
    section.classList.toggle('glossary-section--empty', q.length > 0 && visible.length === 0);
  }
}

export function GlossaryScreen(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'glossary';

  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Glossary';
  root.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'Reference for classes, gear, skills, foes, encounters, and shop stock.';
  root.appendChild(subtitle);

  const toolbar = document.createElement('div');
  toolbar.className = 'glossary-toolbar';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'glossary-search';
  search.placeholder = 'Search names, tags, descriptions…';
  search.setAttribute('aria-label', 'Search glossary');
  search.addEventListener('input', () => applyGlossaryFilter(root, search.value));
  toolbar.appendChild(search);

  const nav = document.createElement('nav');
  nav.className = 'glossary-nav';
  const sectionLinks = [
    ['classes', 'Classes'],
    ['weapons', 'Weapons'],
    ['attacks', 'Attacks'],
    ['passives', 'Passives'],
    ['synergies', 'Synergies'],
    ['enemies', 'Enemies'],
    ['encounters', 'Encounters'],
    ['shop', 'Shop'],
    ['statuses', 'Statuses'],
    ['loot', 'Loot'],
  ];
  for (const [id, label] of sectionLinks) {
    const a = document.createElement('a');
    a.className = 'glossary-nav__link';
    a.href = `#glossary-${id}`;
    a.textContent = label;
    nav.appendChild(a);
  }
  toolbar.appendChild(nav);
  root.appendChild(toolbar);

  // Classes
  const classesSec = glossarySection('classes', 'Classes', 'Starting archetypes with base stats and two weapon options.');
  const classesGrid = glossaryGrid();
  for (const cls of getAllClasses()) {
    const stats = `HP ${cls.baseStats.maxHp} · ATK ${cls.baseStats.attack} · BLK ${cls.baseStats.block} · CRIT ${Math.round(cls.baseStats.critChance * 100)}% · SP ${cls.baseStats.spellPower}`;
    classesGrid.appendChild(
      GlossaryEntry({
        title: cls.name,
        description: cls.description,
        imageKey: cls.imageKey,
        meta: [stats],
        details: cls.starterPassiveId ? [`Starter passive: ${getSkill(cls.starterPassiveId)?.name ?? cls.starterPassiveId}`] : undefined,
      }),
    );
  }
  classesSec.appendChild(classesGrid);
  root.appendChild(classesSec);

  // Weapons
  const weaponsSec = glossarySection('weapons', 'Weapons', 'Chosen at run start; grants stat modifiers and a 0-cooldown basic attack.');
  const weaponsGrid = glossaryGrid();
  for (const weapon of getAllWeapons()) {
    const starter = getSkill(weapon.starterAttackId);
    weaponsGrid.appendChild(
      GlossaryEntry({
        title: weapon.name,
        description: weapon.description,
        imageKey: weapon.imageKey,
        tags: weapon.tags,
        meta: [formatStatMods(weapon.statModifiers), `Class: ${weapon.classId}`],
        details: starter ? [`Basic attack: ${starter.name}`] : undefined,
      }),
    );
  }
  weaponsSec.appendChild(weaponsGrid);
  root.appendChild(weaponsSec);

  // Attacks by weapon
  const attacksSec = glossarySection(
    'attacks',
    'Attacks',
    'Weapon skills used in combat. Basic attack (starter) has no cooldown.',
  );
  for (const weapon of getAllWeapons()) {
    const attacks = getAllSkills().filter((s) => s.type === 'attack' && s.weaponId === weapon.id);
    if (attacks.length === 0) continue;
    attacksSec.appendChild(groupTitle(weapon.name));
    const grid = glossaryGrid();
    for (const skill of attacks) {
      const isBasic = skill.id === weapon.starterAttackId;
      const levelLines = skill.levelDescriptions.map((d, i) => `Lv${i + 1}: ${d}`);
      const cd =
        skill.baseCooldown === 0
          ? 'No cooldown'
          : `Cooldown Lv1–3: ${[1, 2, 3].map((lv) => getSkillCooldown(skill.id, lv)).join(' / ')} turns`;
      grid.appendChild(
        GlossaryEntry({
          title: skill.name + (isBasic ? ' (Basic)' : ''),
          description: skill.description,
          imageKey: skill.imageKey,
          tags: skill.tags,
          meta: [isBasic ? 'Always available' : cd, `Max level ${skill.maxLevel}`],
          details: levelLines,
        }),
      );
    }
    attacksSec.appendChild(grid);
  }
  root.appendChild(attacksSec);

  // Passives by class
  const passivesSec = glossarySection('passives', 'Passives', 'Class skills that apply stat bonuses for the whole run.');
  for (const cls of getAllClasses()) {
    const passives = getAllSkills().filter((s) => s.type === 'passive' && s.classId === cls.id);
    if (passives.length === 0) continue;
    passivesSec.appendChild(groupTitle(cls.name));
    const grid = glossaryGrid();
    for (const skill of passives) {
      grid.appendChild(
        GlossaryEntry({
          title: skill.name,
          description: skill.description,
          imageKey: skill.imageKey,
          tags: skill.tags,
          meta: [`Max level ${skill.maxLevel}`],
          details: skill.levelDescriptions.map((d, i) => `Lv${i + 1}: ${d}`),
        }),
      );
    }
    passivesSec.appendChild(grid);
  }
  root.appendChild(passivesSec);

  // Synergies
  const synSec = glossarySection('synergies', 'Synergies', 'Bonuses when enough owned skills share a tag.');
  const synGrid = glossaryGrid();
  for (const syn of getAllSynergies()) {
    synGrid.appendChild(
      GlossaryEntry({
        title: syn.name,
        description: syn.description,
        tags: syn.requiredTags,
        meta: [`Requires ${syn.minCount}+ matching skills`],
      }),
    );
  }
  synSec.appendChild(synGrid);
  root.appendChild(synSec);

  // Enemies
  const enemiesSec = glossarySection('enemies', 'Enemies', 'Combat opponents; stats scale with floor.');
  const normal = getAllEnemies().filter((e) => e.id !== 'lich');
  const boss = getAllEnemies().filter((e) => e.id === 'lich');

  enemiesSec.appendChild(groupTitle('Regular roster'));
  const normalGrid = glossaryGrid();
  for (const enemy of normal) {
    normalGrid.appendChild(
      GlossaryEntry({
        title: enemy.name,
        description: `${enemy.tier.charAt(0).toUpperCase() + enemy.tier.slice(1)} · ${enemy.behavior} AI`,
        imageKey: enemy.imageKey,
        tags: enemy.tags,
        meta: [`HP ${enemy.baseStats.maxHp} · ATK ${enemy.baseStats.attack}`, `Gold ${enemy.goldDrop[0]}–${enemy.goldDrop[1]}`],
      }),
    );
  }
  enemiesSec.appendChild(normalGrid);

  enemiesSec.appendChild(groupTitle('Boss'));
  const bossGrid = glossaryGrid();
  for (const enemy of boss) {
    bossGrid.appendChild(
      GlossaryEntry({
        title: enemy.name,
        description: 'Boss encounter on floors 10, 15, 20, … Always drops a bonus reward.',
        imageKey: enemy.imageKey,
        tags: enemy.tags,
        meta: [`HP ${enemy.baseStats.maxHp} · ATK ${enemy.baseStats.attack}`, `Gold ${enemy.goldDrop[0]}–${enemy.goldDrop[1]}`],
      }),
    );
  }
  enemiesSec.appendChild(bossGrid);
  root.appendChild(enemiesSec);

  // Encounters
  const encSec = glossarySection(
    'encounters',
    'Encounter types',
    'Floor options are weighted (skill 26%, enemy 37%, shop 15%, heal 22%) then filtered by rules below.',
  );
  const encGrid = glossaryGrid();
  for (const event of getAllEvents()) {
    const weight = EVENT_WEIGHTS[event.id];
    encGrid.appendChild(
      GlossaryEntry({
        title: event.name,
        description: event.description,
        imageKey: event.imageKey,
        tags: event.tags,
        meta: [
          weight !== undefined ? `Weight ${weight}%` : undefined,
          `Screen: ${event.screen}`,
        ].filter(Boolean) as string[],
        details: EVENT_APPEARANCE[event.id] ? [EVENT_APPEARANCE[event.id]] : undefined,
      }),
    );
  }
  encSec.appendChild(encGrid);
  root.appendChild(encSec);

  // Shop
  const shopSec = glossarySection(
    'shop',
    'Shop items',
    'Merchant stock. One random learnable skill may also appear (base price scales with floor).',
  );
  const shopGrid = glossaryGrid();
  shopGrid.appendChild(
    GlossaryEntry({
      title: 'Random skill',
      description: 'Learn a new attack for your weapon or passive for your class.',
      imageKey: 'shop',
      meta: [`Base price ${SHOP_SKILL_BASE_PRICE}g (scales per floor)`],
    }),
  );
  shopGrid.appendChild(
    GlossaryEntry({
      title: SHOP_HEAL_ITEM.name,
      description: SHOP_HEAL_ITEM.description,
      imageKey: 'heal',
      meta: [`Base price ${SHOP_HEAL_ITEM.basePrice}g`],
    }),
  );
  for (const item of SHOP_STAT_ITEMS) {
    shopGrid.appendChild(
      GlossaryEntry({
        title: item.name,
        description: item.description,
        imageKey: 'shop',
        meta: [`Base price ${item.basePrice}g`, 'Permanent this run'],
      }),
    );
  }
  shopSec.appendChild(shopGrid);
  root.appendChild(shopSec);

  // Statuses
  const statusSec = glossarySection('statuses', 'Status effects');
  const statusGrid = glossaryGrid();
  for (const st of STATUS_GLOSSARY) {
    statusGrid.appendChild(
      GlossaryEntry({
        title: st.title,
        description: st.description,
        tags: st.tags,
      }),
    );
  }
  statusSec.appendChild(statusGrid);
  root.appendChild(statusSec);

  // Loot
  const lootSec = glossarySection('loot', 'Loot & rewards');
  const lootGrid = glossaryGrid();
  for (const item of LOOT_GLOSSARY) {
    lootGrid.appendChild(
      GlossaryEntry({
        title: item.title,
        description: item.description,
        imageKey: 'gold',
        details: item.details,
      }),
    );
  }
  lootSec.appendChild(lootGrid);
  root.appendChild(lootSec);

  return root;
}
