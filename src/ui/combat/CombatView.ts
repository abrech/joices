import type { GameEngine } from '../../game/GameEngine';
import type { CombatEnemyInstance, CombatState, GameState } from '../../types/game-state';
import { pickLowestHpTargetIndex } from '../../game/combat/combat-state';
import { getEnemy, getSkill, getClass, getWeapon } from '../../content/registries';
import {
  canAffordSkill,
  getSkillDescription,
  getSkillManaCost,
} from '../../game/systems/SkillSystem';
import { AssetImage } from '../components/AssetImage';
import { CombatLog, scrollCombatLogToLatest } from '../components/CombatLog';
import { StatusBadges } from '../components/StatusBadges';
import { formatTagsLine } from '../components/TagChips';
import { Tooltip } from '../components/Tooltip';

export interface CombatViewState {
  busy: boolean;
  lastLogLength: number;
}

export function createCombatViewState(): CombatViewState {
  return { busy: false, lastLogLength: 0 };
}

function buildFighter(
  side: 'player' | 'enemy',
  name: string,
  imageKey: string,
  hp: number,
  maxHp: number,
  enemyFill?: boolean,
  instanceId?: string,
  mana?: { current: number; max: number },
): HTMLElement {
  const div = document.createElement('div');
  div.className = 'combat-fighter';
  div.dataset.fighter = side;
  if (instanceId) div.dataset.enemyInstance = instanceId;
  div.appendChild(AssetImage(imageKey, 'card__image', name));
  const title = document.createElement('h3');
  title.textContent = name;
  div.appendChild(title);
  const hpText = document.createElement('p');
  hpText.dataset.hpText = '';
  hpText.textContent = `${hp} / ${maxHp} HP`;
  div.appendChild(hpText);
  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar';
  const fill = document.createElement('div');
  fill.className = 'hp-bar__fill' + (enemyFill ? ' hp-bar__fill--enemy' : '');
  fill.style.width = `${(hp / maxHp) * 100}%`;
  hpBar.appendChild(fill);
  div.appendChild(hpBar);

  if (side === 'player' && mana) {
    const manaText = document.createElement('p');
    manaText.dataset.manaText = '';
    manaText.className = 'combat-mana-text';
    manaText.textContent = `${mana.current} / ${mana.max} Mana`;
    div.appendChild(manaText);
    const manaBar = document.createElement('div');
    manaBar.className = 'mana-bar';
    const manaFill = document.createElement('div');
    manaFill.className = 'mana-bar__fill';
    manaFill.style.width = `${(mana.current / Math.max(1, mana.max)) * 100}%`;
    manaBar.appendChild(manaFill);
    div.appendChild(manaBar);
  }

  const badges = document.createElement('div');
  badges.dataset.badges = '';
  div.appendChild(badges);
  return div;
}

function orderedAttackSkills(run: GameState['run']) {
  const basicId = getWeapon(run.player.weaponId)?.starterAttackId;
  const attacks: { owned: (typeof run.player.skills)[number]; skill: NonNullable<ReturnType<typeof getSkill>> }[] =
    [];
  for (const owned of run.player.skills) {
    const skill = getSkill(owned.id);
    if (skill?.type !== 'attack') continue;
    attacks.push({ owned, skill });
  }
  if (basicId) {
    attacks.sort((a, b) => {
      if (a.owned.id === basicId) return 1;
      if (b.owned.id === basicId) return -1;
      return 0;
    });
  }
  return { attacks, basicId };
}

function buildActions(
  engine: GameEngine,
  run: GameState['run'],
  combat: CombatState,
  viewState: CombatViewState,
): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'btn-row btn-row--combat';
  actions.dataset.actions = '';

  const { attacks, basicId } = orderedAttackSkills(run);

  for (const { owned, skill } of attacks) {
    const cd = combat.skillCooldowns[owned.id] ?? 0;
    const cost = getSkillManaCost(owned.id);
    const affordable = canAffordSkill(combat, owned.id);
    const isBasic = owned.id === basicId;
    const btn = document.createElement('button');
    btn.className = isBasic ? 'btn btn--primary' : 'btn btn--secondary';
    btn.dataset.skillId = owned.id;
    btn.textContent =
      cd > 0 ? `${skill.name} (CD: ${cd})` : `${skill.name} (${cost} mana)`;
    btn.disabled = cd > 0 || !affordable;
    btn.addEventListener('click', () => {
      if (viewState.busy) return;
      engine.combatUseSkill(owned.id);
    });
    const levelDesc = getSkillDescription(owned.id, owned.level);
    const tagsLine = formatTagsLine(skill.tags);
    const cdLine = cd > 0 ? `\nOn cooldown: ${cd} turn(s)` : '';
    const manaLine = `Mana cost: ${cost}`;
    const tooltipParts = [skill.description, levelDesc, manaLine, tagsLine, cdLine].filter(Boolean);
    actions.appendChild(Tooltip(tooltipParts.join('\n\n'), btn, { variant: 'action' }));
  }

  const endTurn = document.createElement('button');
  endTurn.type = 'button';
  endTurn.className = 'btn btn--accent';
  endTurn.dataset.endTurn = '';
  endTurn.textContent = 'End Turn';
  endTurn.addEventListener('click', () => {
    if (viewState.busy) return;
    engine.combatEndTurn();
  });
  actions.appendChild(endTurn);

  return actions;
}

function appendEnemyFighter(
  parent: HTMLElement,
  instance: CombatEnemyInstance,
  combat: CombatState,
): void {
  const def = getEnemy(instance.enemyId);
  const div = buildFighter(
    'enemy',
    def?.name ?? 'Enemy',
    def?.imageKey ?? 'enemy',
    instance.hp,
    instance.maxHp,
    true,
    instance.instanceId,
  );
  div.querySelector('[data-badges]')!.appendChild(
    StatusBadges({ statuses: instance.statuses, stunned: instance.stunned }),
  );
  if (
    pickLowestHpTargetIndex(combat) ===
    combat.enemies.findIndex((e) => e.instanceId === instance.instanceId)
  ) {
    div.classList.add('combat-fighter--target');
  }
  parent.appendChild(div);
}

export function createCombatRoot(engine: GameEngine, state: GameState, viewState: CombatViewState): HTMLElement {
  const { run } = state;
  const combat = run.combat!;
  const classDef = getClass(run.player.classId);

  const el = document.createElement('div');
  el.className = 'combat-screen';
  el.setAttribute('aria-live', 'polite');

  const heading = document.createElement('h1');
  heading.className = 'screen-title';
  heading.textContent = combat.isBoss ? 'Boss Fight' : 'Combat';
  el.appendChild(heading);

  const area = document.createElement('div');
  area.className = 'combat-area';

  const playerDiv = buildFighter(
    'player',
    'You',
    classDef?.imageKey ?? 'warrior',
    run.player.hp,
    run.player.stats.maxHp,
    false,
    undefined,
    { current: combat.currentMana, max: run.player.stats.maxMana },
  );
  playerDiv.querySelector('[data-badges]')!.appendChild(
    StatusBadges({ statuses: combat.playerStatuses, dodgeNext: combat.playerDodgeNext }),
  );

  const enemiesWrap = document.createElement('div');
  enemiesWrap.className = 'combat-enemies';
  for (const instance of combat.enemies) {
    appendEnemyFighter(enemiesWrap, instance, combat);
  }

  area.appendChild(playerDiv);
  area.appendChild(enemiesWrap);

  const banner = document.createElement('div');
  banner.className = 'combat-turn-banner';
  banner.dataset.turnBanner = '';
  banner.textContent = 'Enemy turn…';
  banner.hidden = true;
  area.appendChild(banner);

  el.appendChild(area);

  const log = CombatLog(combat.log, 0);
  log.dataset.combatLog = '';
  el.appendChild(log);
  viewState.lastLogLength = combat.log.length;

  el.appendChild(buildActions(engine, run, combat, viewState));
  return el;
}

function refreshActionButtons(
  root: HTMLElement,
  run: GameState['run'],
  combat: CombatState,
  viewState: CombatViewState,
): void {
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  if (!actions) return;

  for (const owned of run.player.skills) {
    const skill = getSkill(owned.id);
    if (skill?.type !== 'attack') continue;

    const btn = actions.querySelector<HTMLButtonElement>(`button[data-skill-id="${owned.id}"]`);
    if (!btn) continue;

    const cd = combat.skillCooldowns[owned.id] ?? 0;
    const cost = getSkillManaCost(owned.id);
    const affordable = canAffordSkill(combat, owned.id);
    const label =
      cd > 0
        ? `${skill.name} (CD: ${cd})`
        : `${skill.name} (${cost} mana)`;
    btn.textContent = label;
    btn.disabled = cd > 0 || !affordable || viewState.busy;
  }

  const endBtn = actions.querySelector<HTMLButtonElement>('[data-end-turn]');
  if (endBtn) endBtn.disabled = viewState.busy;
}

export function updateCombatDom(
  root: HTMLElement,
  state: GameState,
  viewState: CombatViewState,
): void {
  const { run } = state;
  const combat = run.combat!;

  const playerFighter = root.querySelector<HTMLElement>('[data-fighter="player"]')!;

  playerFighter.querySelector('[data-hp-text]')!.textContent =
    `${run.player.hp} / ${run.player.stats.maxHp} HP`;
  playerFighter.querySelector<HTMLElement>('.hp-bar__fill')!.style.width =
    `${(run.player.hp / run.player.stats.maxHp) * 100}%`;

  const manaText = playerFighter.querySelector('[data-mana-text]');
  const manaFill = playerFighter.querySelector<HTMLElement>('.mana-bar__fill');
  if (manaText) {
    manaText.textContent = `${combat.currentMana} / ${run.player.stats.maxMana} Mana`;
  }
  if (manaFill) {
    manaFill.style.width = `${(combat.currentMana / Math.max(1, run.player.stats.maxMana)) * 100}%`;
  }

  const pb = playerFighter.querySelector('[data-badges]')!;
  pb.replaceChildren(
    StatusBadges({
      statuses: combat.playerStatuses,
      dodgeNext: combat.playerDodgeNext,
    }),
  );

  for (const instance of combat.enemies) {
    const fighter = root.querySelector<HTMLElement>(
      `[data-enemy-instance="${instance.instanceId}"]`,
    );
    if (!fighter) continue;
    fighter.querySelector('[data-hp-text]')!.textContent =
      `${instance.hp} / ${instance.maxHp} HP`;
    fighter.querySelector<HTMLElement>('.hp-bar__fill')!.style.width =
      `${(instance.hp / instance.maxHp) * 100}%`;
    fighter.classList.toggle(
      'combat-fighter--target',
      pickLowestHpTargetIndex(combat) ===
        combat.enemies.findIndex((e) => e.instanceId === instance.instanceId),
    );
    fighter.classList.toggle('combat-fighter--defeated', instance.hp <= 0);
    const badges = fighter.querySelector('[data-badges]')!;
    badges.replaceChildren(
      StatusBadges({
        statuses: instance.statuses,
        stunned: instance.stunned,
      }),
    );
  }

  const logHost = root.querySelector('[data-combat-log]')!;
  const newCount = Math.max(0, combat.log.length - viewState.lastLogLength);
  const newLog = CombatLog(combat.log, newCount);
  newLog.dataset.combatLog = '';
  logHost.replaceWith(newLog);
  scrollCombatLogToLatest(newLog);
  viewState.lastLogLength = combat.log.length;

  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const showActions = !combat.finished && combat.turn === 'player' && !viewState.busy;

  if (banner) {
    const showActionBanner = root.dataset.actionBanner === 'true';
    banner.hidden = !(
      viewState.busy &&
      !combat.finished &&
      (showActionBanner || combat.turn === 'enemy')
    );
  }
  if (actions) {
    actions.hidden = !showActions;
  }

  root.classList.toggle('combat-screen--busy', viewState.busy);
  root.setAttribute('aria-busy', viewState.busy ? 'true' : 'false');

  if (combat.turn === 'player') {
    refreshActionButtons(root, run, combat, viewState);
  }
}
