import type { GameEngine } from '../../game/GameEngine';
import type { CombatLastAction, CombatState, GameState } from '../../types/game-state';
import { getEnemy, getSkill, getClass, getWeapon } from '../../content/registries';
import { getSkillDescription } from '../../game/systems/SkillSystem';
import { AssetImage } from '../components/AssetImage';
import { CombatLog } from '../components/CombatLog';
import { StatusBadges } from '../components/StatusBadges';
import { formatTagsLine } from '../components/TagChips';
import { Tooltip } from '../components/Tooltip';
import {
  animMs,
  ENEMY_ACTION_ANIM_MS,
  ENEMY_TURN_BANNER_MS,
  PLAYER_ACTION_ANIM_MS,
  VICTORY_ANIM_MS,
  DEFEAT_ANIM_MS,
} from '../animation/timing';

let busy = false;
let lastLogLength = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function playActionAnimations(
  root: HTMLElement,
  action: CombatLastAction | undefined,
): Promise<void> {
  if (!action) return delay(animMs(80));

  const playerFighter = root.querySelector<HTMLElement>('[data-fighter="player"]');
  const enemyFighter = root.querySelector<HTMLElement>('[data-fighter="enemy"]');

  const hitTarget =
    action.actor === 'player' && action.damage
      ? enemyFighter
      : action.actor === 'enemy' && action.damage
        ? playerFighter
        : null;
  const lungeActor =
    action.actor === 'player' && (action.kind === 'attack' || action.kind === 'skill')
      ? playerFighter
      : action.actor === 'enemy' && action.kind === 'attack'
        ? enemyFighter
        : null;

  const duration = animMs(
    action.actor === 'player' ? PLAYER_ACTION_ANIM_MS : ENEMY_ACTION_ANIM_MS,
  );

  if (lungeActor) {
    lungeActor.classList.add(action.actor === 'player' ? 'fighter-lunge-right' : 'fighter-lunge-left');
  }
  if (hitTarget && action.damage) {
    hitTarget.classList.add(action.crit ? 'fighter-crit-hit' : 'fighter-hit');
    hitTarget.querySelector<HTMLElement>('.hp-bar__fill')?.classList.add('hp-bar__fill--damage');
    const popup = document.createElement('span');
    popup.className = 'damage-popup' + (action.crit ? ' damage-popup--crit' : '');
    popup.textContent = `-${action.damage}`;
    hitTarget.appendChild(popup);
    if (action.actor === 'enemy') {
      document.querySelector('.stats-panel')?.classList.add('stats-panel--player-hit');
      setTimeout(
        () => document.querySelector('.stats-panel')?.classList.remove('stats-panel--player-hit'),
        animMs(450),
      );
    }
  }

  return delay(duration).then(() => {
    lungeActor?.classList.remove('fighter-lunge-right', 'fighter-lunge-left');
    hitTarget?.classList.remove('fighter-hit', 'fighter-crit-hit');
    hitTarget?.querySelector('.hp-bar__fill')?.classList.remove('hp-bar__fill--damage');
    hitTarget?.querySelector('.damage-popup')?.remove();
  });
}

function updateCombatDom(root: HTMLElement, state: GameState): void {
  const { run } = state;
  const combat = run.combat!;

  const playerFighter = root.querySelector<HTMLElement>('[data-fighter="player"]')!;
  const enemyFighter = root.querySelector<HTMLElement>('[data-fighter="enemy"]')!;

  playerFighter.querySelector('[data-hp-text]')!.textContent =
    `${run.player.hp} / ${run.player.stats.maxHp} HP`;
  playerFighter.querySelector<HTMLElement>('.hp-bar__fill')!.style.width =
    `${(run.player.hp / run.player.stats.maxHp) * 100}%`;

  enemyFighter.querySelector('[data-hp-text]')!.textContent =
    `${combat.enemyHp} / ${combat.enemyMaxHp} HP`;
  enemyFighter.querySelector<HTMLElement>('.hp-bar__fill')!.style.width =
    `${(combat.enemyHp / combat.enemyMaxHp) * 100}%`;

  const pb = playerFighter.querySelector('[data-badges]')!;
  pb.replaceChildren(
    StatusBadges({
      statuses: combat.playerStatuses,
      dodgeNext: combat.playerDodgeNext,
    }),
  );

  const eb = enemyFighter.querySelector('[data-badges]')!;
  eb.replaceChildren(
    StatusBadges({
      statuses: combat.enemyStatuses,
      stunned: combat.enemyStunned,
    }),
  );

  const logHost = root.querySelector('[data-combat-log]')!;
  const newCount = Math.max(0, combat.log.length - lastLogLength);
  const newLog = CombatLog(combat.log, newCount);
  newLog.dataset.combatLog = '';
  logHost.replaceWith(newLog);
  lastLogLength = combat.log.length;

  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const showActions = !combat.finished && combat.turn === 'player' && !busy;

  if (banner) {
    banner.hidden = !(busy && combat.turn === 'enemy' && !combat.finished);
  }
  if (actions) {
    actions.hidden = !showActions;
  }

  root.classList.toggle('combat-screen--busy', busy);
  root.setAttribute('aria-busy', busy ? 'true' : 'false');

  if (combat.turn === 'player') {
    refreshActionButtons(root, run, combat);
  }
}

function refreshActionButtons(
  root: HTMLElement,
  run: GameState['run'],
  combat: CombatState,
): void {
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  if (!actions) return;

  for (const owned of run.player.skills) {
    const skill = getSkill(owned.id);
    if (skill?.type !== 'attack') continue;

    const btn = actions.querySelector<HTMLButtonElement>(`button[data-skill-id="${owned.id}"]`);
    if (!btn) continue;

    const cd = combat.skillCooldowns[owned.id] ?? 0;
    btn.textContent = cd > 0 ? `${skill.name} (CD: ${cd})` : skill.name;
    btn.disabled = cd > 0 || busy;
  }
}

function buildFighter(
  side: 'player' | 'enemy',
  name: string,
  imageKey: string,
  hp: number,
  maxHp: number,
  enemyFill?: boolean,
): HTMLElement {
  const div = document.createElement('div');
  div.className = 'combat-fighter';
  div.dataset.fighter = side;
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
      if (a.owned.id === basicId) return -1;
      if (b.owned.id === basicId) return 1;
      return 0;
    });
  }
  return { attacks, basicId };
}

function buildActions(engine: GameEngine, run: GameState['run'], combat: CombatState): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'btn-row';
  actions.dataset.actions = '';

  const { attacks, basicId } = orderedAttackSkills(run);

  for (const { owned, skill } of attacks) {
    const cd = combat.skillCooldowns[owned.id] ?? 0;
    const isBasic = owned.id === basicId;
    const btn = document.createElement('button');
    btn.className = isBasic ? 'btn btn--primary' : 'btn btn--secondary';
    btn.dataset.skillId = owned.id;
    btn.textContent = cd > 0 ? `${skill.name} (CD: ${cd})` : skill.name;
    btn.disabled = cd > 0;
    btn.addEventListener('click', () => {
      if (busy) return;
      engine.combatUseSkill(owned.id);
    });
    const levelDesc = getSkillDescription(owned.id, owned.level);
    const tagsLine = formatTagsLine(skill.tags);
    const cdLine = cd > 0 ? `\nOn cooldown: ${cd} turn(s)` : '';
    const tooltipParts = [skill.description, levelDesc, tagsLine, cdLine].filter(Boolean);
    actions.appendChild(Tooltip(tooltipParts.join('\n\n'), btn, { variant: 'action' }));
  }

  return actions;
}

function createCombatRoot(engine: GameEngine, state: GameState): HTMLElement {
  const { run } = state;
  const combat = run.combat!;
  const enemy = getEnemy(combat.enemyId)!;
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
  );
  playerDiv.querySelector('[data-badges]')!.appendChild(
    StatusBadges({ statuses: combat.playerStatuses, dodgeNext: combat.playerDodgeNext }),
  );

  const enemyDiv = buildFighter(
    'enemy',
    enemy.name,
    enemy.imageKey,
    combat.enemyHp,
    combat.enemyMaxHp,
    true,
  );
  enemyDiv.querySelector('[data-badges]')!.appendChild(
    StatusBadges({ statuses: combat.enemyStatuses, stunned: combat.enemyStunned }),
  );

  area.appendChild(playerDiv);
  area.appendChild(enemyDiv);

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
  lastLogLength = combat.log.length;

  el.appendChild(buildActions(engine, run, combat));
  return el;
}

function cloneCombat(c: CombatState): CombatState {
  return structuredClone(c);
}

async function processCombatUpdate(
  root: HTMLElement,
  engine: GameEngine,
  state: GameState,
  prev: CombatState | undefined,
): Promise<void> {
  const combat = state.run.combat;
  if (!combat) return;

  const playerJustActed = prev?.turn === 'player' && combat.turn === 'enemy' && !combat.finished;
  const enemyJustActed = prev?.turn === 'enemy' && combat.turn === 'player' && !combat.finished;
  const justFinished = combat.finished && !prev?.finished;

  if (playerJustActed && !combat.finished) {
    busy = true;
    updateCombatDom(root, state);
    await playActionAnimations(root, combat.lastAction);
    engine.clearCombatLastAction();
    updateCombatDom(root, engine.getState());
    await delay(animMs(ENEMY_TURN_BANNER_MS));
    engine.resolveEnemyTurn();
    busy = false;
    return;
  }

  if (enemyJustActed && combat.lastAction) {
    busy = true;
    updateCombatDom(root, state);
    await playActionAnimations(root, combat.lastAction);
    engine.clearCombatLastAction();
    updateCombatDom(root, engine.getState());
    busy = false;
    return;
  }

  if (justFinished && combat.result === 'win') {
    busy = true;
    root.classList.add('combat-victory-flash');
    updateCombatDom(root, state);
    await delay(animMs(VICTORY_ANIM_MS));
    root.classList.remove('combat-victory-flash');
    busy = false;
    engine.combatVictoryContinue();
    return;
  }

  if (justFinished && combat.result === 'lose') {
    busy = true;
    updateCombatDom(root, state);
    await delay(animMs(DEFEAT_ANIM_MS));
    busy = false;
    engine.combatDefeatContinue();
    return;
  }

  updateCombatDom(root, state);
}

export function mountCombatScreen(container: HTMLElement, engine: GameEngine): () => void {
  busy = false;
  lastLogLength = 0;

  const root = createCombatRoot(engine, engine.getState());
  container.appendChild(root);

  let prevCombat: CombatState | undefined = cloneCombat(engine.getState().run.combat!);
  let draining = false;
  const queue: GameState[] = [];

  const drain = async () => {
    if (draining) return;
    draining = true;
    while (queue.length > 0) {
      const state = queue.shift()!;
      if (!state.run.combat) continue;
      await processCombatUpdate(root, engine, state, prevCombat);
      prevCombat = state.run.combat ? cloneCombat(state.run.combat) : undefined;
    }
    draining = false;
  };

  const unsub = engine.subscribe((state) => {
    if (!state.run.combat) return;
    queue.push(state);
    void drain();
  });

  return () => {
    unsub();
    root.remove();
    busy = false;
    queue.length = 0;
  };
}
