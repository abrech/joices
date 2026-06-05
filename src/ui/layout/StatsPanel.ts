import type { GameState } from '../../types/game-state';
import { getClass, getWeapon, getSkill, getSynergy } from '../../content/registries';
import { AssetImage } from '../components/AssetImage';
import { Tooltip } from '../components/Tooltip';
import { TagChips, formatTagsLine } from '../components/TagChips';
import { getSkillDescription } from '../../game/systems/SkillSystem';

export function StatsPanel(state: GameState): HTMLElement {
  const panel = document.createElement('aside');
  panel.className = 'layout-sidebar stats-panel';

  const { player, floor, phase } = state.run;
  const classDef = getClass(player.classId);
  const weaponDef = getWeapon(player.weaponId);

  if (phase === 'classSelect' || phase === 'weaponSelect') {
    panel.innerHTML = '<div class="stats-panel__section"><div class="stats-panel__section-title">Joices</div><p style="color:var(--text-secondary);font-size:0.9rem">A floor-based roguelike. Choose wisely.</p></div>';
    return panel;
  }

  const floorSection = document.createElement('div');
  floorSection.className = 'stats-panel__section';
  floorSection.innerHTML = `<div class="stats-panel__section-title">Run</div>`;
  const floorRow = document.createElement('div');
  floorRow.className = 'stat-row';
  floorRow.innerHTML = `<span class="stat-row__label">Floor</span><span>${floor}</span>`;
  floorSection.appendChild(floorRow);
  panel.appendChild(floorSection);

  if (classDef && weaponDef) {
    const loadout = document.createElement('div');
    loadout.className = 'stats-panel__section';
    loadout.innerHTML = `<div class="stats-panel__section-title">Loadout</div>`;
    const loadoutRow = document.createElement('div');
    loadoutRow.style.display = 'flex';
    loadoutRow.style.gap = '0.5rem';
    loadoutRow.style.alignItems = 'center';
    loadoutRow.appendChild(AssetImage(classDef.imageKey, 'skill-chip__img', classDef.name));
    loadoutRow.appendChild(AssetImage(weaponDef.imageKey, 'skill-chip__img', weaponDef.name));
    const names = document.createElement('div');
    names.style.fontSize = '0.85rem';
    names.innerHTML = `${classDef.name}<br>${weaponDef.name}`;
    loadoutRow.appendChild(names);
    loadout.appendChild(loadoutRow);
    panel.appendChild(loadout);
  }

  const statsSection = document.createElement('div');
  statsSection.className = 'stats-panel__section';
  statsSection.innerHTML = `<div class="stats-panel__section-title">Stats</div>`;

  const statRows: [string, string][] = [
    ['HP', `${player.hp} / ${player.stats.maxHp}`],
    ['Attack', String(player.stats.attack)],
    ['Crit', `${Math.round(player.stats.critChance * 100)}%`],
    ['Block', String(player.stats.block)],
    ['Spell', String(player.stats.spellPower)],
    ['Mana', `${state.run.combat?.currentMana ?? player.stats.maxMana} / ${player.stats.maxMana}`],
    ['Mana regen', `+${player.stats.manaRegen} / turn`],
    ['Gold', String(player.gold)],
  ];

  for (const [label, value] of statRows) {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `<span class="stat-row__label">${label}</span><span>${value}</span>`;
    statsSection.appendChild(row);
  }

  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar';
  const hpFill = document.createElement('div');
  hpFill.className = 'hp-bar__fill';
  hpFill.style.width = `${(player.hp / player.stats.maxHp) * 100}%`;
  hpBar.appendChild(hpFill);
  statsSection.appendChild(hpBar);
  panel.appendChild(statsSection);

  const skillsSection = document.createElement('div');
  skillsSection.className = 'stats-panel__section stats-panel__skills';
  skillsSection.innerHTML = `<div class="stats-panel__section-title">Skills</div>`;

  for (const owned of player.skills) {
    const skill = getSkill(owned.id);
    if (!skill) continue;
    const img = AssetImage(skill.imageKey, 'skill-chip__img', skill.name);
    const body = document.createElement('span');
    body.className = 'skill-chip__body';
    const label = document.createElement('span');
    label.textContent = `${skill.name} Lv${owned.level}`;
    body.appendChild(label);
    if (skill.tags.length > 0) {
      body.appendChild(TagChips(skill.tags));
    }

    const desc = getSkillDescription(owned.id, owned.level);
    const tagsLine = formatTagsLine(skill.tags);
    const tooltipSections = [
      { type: 'title' as const, text: `${skill.name} Lv${owned.level}` },
      { type: 'body' as const, text: skill.description },
      { type: 'body' as const, text: desc },
      ...(tagsLine ? [{ type: 'meta' as const, text: tagsLine }] : []),
    ];
    const chipInner = document.createElement('span');
    chipInner.className = 'skill-chip';
    chipInner.appendChild(img);
    chipInner.appendChild(body);

    skillsSection.appendChild(Tooltip(tooltipSections, chipInner, { variant: 'panel' }));
  }

  if (player.skills.length === 0) {
    skillsSection.innerHTML += '<div style="font-size:0.8rem;color:var(--text-muted)">No skills yet</div>';
  }
  panel.appendChild(skillsSection);

  if (player.activeSynergyIds.length > 0) {
    const synSection = document.createElement('div');
    synSection.className = 'stats-panel__section';
    synSection.innerHTML = `<div class="stats-panel__section-title">Synergies</div>`;
    for (const id of player.activeSynergyIds) {
      const syn = getSynergy(id);
      if (!syn) continue;
      const item = document.createElement('div');
      item.className = 'synergy-item';
      item.textContent = `${syn.name}: ${syn.description}`;
      synSection.appendChild(item);
    }
    panel.appendChild(synSection);
  }

  return panel;
}
