import type { GameEngine } from '../../game/GameEngine';
import type { CombatEnemyInstance, CombatLastAction, CombatState, GameState } from '../../types/game-state';
import { enemyDisplayLabel, pickLowestHpTargetIndex } from '../../game/combat/combat-state';
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
import {
  animMs,
  ENEMY_ACTION_ANIM_MS,
  ENEMY_CHARGED_ACTION_ANIM_MS,
  ENEMY_TURN_BANNER_MS,
  PLAYER_ACTION_ANIM_MS,
  VICTORY_ANIM_MS,
  DEFEAT_ANIM_MS,
  prefersReducedMotion,
} from '../animation/timing';

let busy = false;
let lastLogLength = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function actionBannerLabel(action: CombatLastAction, enemyName: string): string {
  if (action.label) return action.label;
  switch (action.kind) {
    case 'attack':
      return `${enemyName} attacks!`;
    case 'block':
      return 'Enemy braces…';
    case 'dodge':
      return 'You dodge!';
    case 'stun':
      return 'Enemy is stunned!';
    case 'status':
      return 'Status damage';
    default:
      return action.actor === 'enemy' ? 'Enemy turn…' : 'Your turn';
  }
}

function setActionBanner(root: HTMLElement, text: string): void {
  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  if (!banner) return;
  banner.textContent = text;
  root.dataset.actionBanner = 'true';
  banner.hidden = false;
}

function hideActionBanner(root: HTMLElement): void {
  delete root.dataset.actionBanner;
  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  if (banner) banner.hidden = true;
}

function enemyFighterEl(
  root: HTMLElement,
  action: CombatLastAction | undefined,
): HTMLElement | null {
  if (action?.targetInstanceId) {
    return root.querySelector<HTMLElement>(
      `[data-enemy-instance="${action.targetInstanceId}"]`,
    );
  }
  return root.querySelector<HTMLElement>('[data-enemy-instance]');
}

function allEnemyFighters(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-enemy-instance]')];
}

function playActionAnimations(
  root: HTMLElement,
  action: CombatLastAction | undefined,
  enemyName: string,
  showBanner: boolean,
): Promise<void> {
  if (!action) return delay(animMs(80));

  const playerFighter = root.querySelector<HTMLElement>('[data-fighter="player"]');
  const enemyFighter = enemyFighterEl(root, action);
  const aoeEnemyHits =
    action.actor === 'player' && action.damage && action.aoe ? allEnemyFighters(root) : [];

  if (showBanner) {
    setActionBanner(root, actionBannerLabel(action, enemyName));
  }

  const hitTarget =
    action.actor === 'enemy' && action.damage
      ? playerFighter
      : aoeEnemyHits.length > 1
        ? null
        : action.actor === 'player' && action.damage
          ? enemyFighter
          : null;
  const lungeActor =
    action.actor === 'player' && (action.kind === 'attack' || action.kind === 'skill')
      ? playerFighter
      : action.actor === 'enemy' && action.kind === 'attack'
        ? enemyFighter
        : null;

  let duration = animMs(
    action.actor === 'player' ? PLAYER_ACTION_ANIM_MS : ENEMY_ACTION_ANIM_MS,
  );
  if (action.actor === 'enemy' && action.charged) {
    duration = animMs(ENEMY_CHARGED_ACTION_ANIM_MS);
  }

  const effectClasses: string[] = [];

  if (lungeActor) {
    if (action.actor === 'player') {
      lungeActor.classList.add('fighter-lunge-right');
      effectClasses.push('fighter-lunge-right');
    } else if (action.charged) {
      lungeActor.classList.add('fighter-lunge-left--charged');
      effectClasses.push('fighter-lunge-left--charged');
    } else {
      lungeActor.classList.add('fighter-lunge-left');
      effectClasses.push('fighter-lunge-left');
    }
  } else if (action.actor === 'enemy') {
    if (action.kind === 'block' && enemyFighter) {
      enemyFighter.classList.add('fighter-brace');
      effectClasses.push('fighter-brace');
    } else if (action.kind === 'stun' && enemyFighter) {
      enemyFighter.classList.add('fighter-stunned');
      effectClasses.push('fighter-stunned');
    } else if (action.kind === 'dodge' && playerFighter) {
      playerFighter.classList.add('fighter-dodge-flash');
      effectClasses.push('fighter-dodge-flash');
    }
  }

  const statusHitTargets =
    action.kind === 'status' && action.damage
      ? action.targetInstanceId
        ? [enemyFighter].filter(Boolean) as HTMLElement[]
        : allEnemyFighters(root)
      : [];
  for (const el of statusHitTargets) {
    el.classList.add('fighter-status-hit');
    effectClasses.push('fighter-status-hit');
    el.querySelector<HTMLElement>('.hp-bar__fill')?.classList.add('hp-bar__fill--damage');
  }

  if (aoeEnemyHits.length > 1 && action.damage) {
    for (const el of aoeEnemyHits) {
      const hitClass = action.crit ? 'fighter-crit-hit' : 'fighter-hit';
      el.classList.add(hitClass);
      el.querySelector<HTMLElement>('.hp-bar__fill')?.classList.add('hp-bar__fill--damage');
      const popup = document.createElement('span');
      popup.className = 'damage-popup' + (action.crit ? ' damage-popup--crit' : '');
      popup.textContent = `-${action.damage}`;
      el.appendChild(popup);
    }
  } else if (hitTarget && action.damage) {
    const hitClass = action.crit ? 'fighter-crit-hit' : 'fighter-hit';
    hitTarget.classList.add(hitClass);
    effectClasses.push(hitClass);
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
    for (const cls of effectClasses) {
      playerFighter?.classList.remove(cls);
      enemyFighter?.classList.remove(cls);
      for (const el of aoeEnemyHits) el.classList.remove(cls);
      for (const el of statusHitTargets) el.classList.remove(cls);
    }
    const cleanupEls = [
      hitTarget,
      enemyFighter,
      ...aoeEnemyHits,
      ...statusHitTargets,
    ].filter(Boolean) as HTMLElement[];
    for (const el of cleanupEls) {
      el.querySelector('.hp-bar__fill')?.classList.remove('hp-bar__fill--damage');
      el.querySelector('.damage-popup')?.remove();
    }
    if (showBanner) hideActionBanner(root);
  });
}

function updateCombatDom(root: HTMLElement, state: GameState): void {
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
  const newCount = Math.max(0, combat.log.length - lastLogLength);
  const newLog = CombatLog(combat.log, newCount);
  newLog.dataset.combatLog = '';
  logHost.replaceWith(newLog);
  scrollCombatLogToLatest(newLog);
  lastLogLength = combat.log.length;

  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  const actions = root.querySelector<HTMLElement>('[data-actions]');
  const showActions = !combat.finished && combat.turn === 'player' && !busy;

  if (banner) {
    const showActionBanner = root.dataset.actionBanner === 'true';
    banner.hidden = !(
      busy &&
      !combat.finished &&
      (showActionBanner || combat.turn === 'enemy')
    );
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
    const cost = getSkillManaCost(owned.id);
    const affordable = canAffordSkill(combat, owned.id);
    const label =
      cd > 0
        ? `${skill.name} (CD: ${cd})`
        : `${skill.name} (${cost} mana)`;
    btn.textContent = label;
    btn.disabled = cd > 0 || !affordable || busy;
  }

  const endBtn = actions.querySelector<HTMLButtonElement>('[data-end-turn]');
  if (endBtn) endBtn.disabled = busy;
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

function buildActions(engine: GameEngine, run: GameState['run'], combat: CombatState): HTMLElement {
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
      if (busy) return;
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
    if (busy) return;
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

function createCombatRoot(engine: GameEngine, state: GameState): HTMLElement {
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

  const playerEndedTurn =
    prev?.turn === 'player' && combat.turn === 'enemy' && !combat.finished;
  const playerUsedSkill =
    prev?.turn === 'player' &&
    combat.turn === 'player' &&
    !combat.finished &&
    combat.lastAction?.actor === 'player' &&
    (prev.lastAction !== combat.lastAction ||
      prev.currentMana !== combat.currentMana);
  const enemyJustActed = prev?.turn === 'enemy' && combat.turn === 'player' && !combat.finished;
  const enemyPhaseContinues =
    prev?.turn === 'enemy' && combat.turn === 'enemy' && !combat.finished && !!combat.lastAction;
  const justFinished = combat.finished && !prev?.finished;
  const enemyName = enemyDisplayLabel(combat);

  if (playerUsedSkill) {
    busy = true;
    updateCombatDom(root, state);
    await playActionAnimations(root, combat.lastAction, enemyName, false);
    engine.clearCombatLastAction();
    busy = false;
    updateCombatDom(root, engine.getState());
    return;
  }

  if (playerEndedTurn && !combat.finished) {
    busy = true;
    updateCombatDom(root, state);
    await playActionAnimations(root, combat.lastAction, enemyName, false);
    engine.clearCombatLastAction();
    updateCombatDom(root, engine.getState());
    setActionBanner(root, 'Enemy turn…');
    updateCombatDom(root, engine.getState());
    if (!prefersReducedMotion()) {
      await delay(animMs(ENEMY_TURN_BANNER_MS));
    }
    hideActionBanner(root);

    while (true) {
      engine.resolveEnemyTurn();
      const after = engine.getState();
      const c = after.run.combat;
      if (!c || c.finished || c.turn === 'player') break;
      updateCombatDom(root, after);
      if (c.lastAction) {
        const label =
          getEnemy(
            c.enemies.find((e) => e.instanceId === c.lastAction?.targetInstanceId)?.enemyId ??
              c.enemies[0]?.enemyId ??
              '',
          )?.name ?? enemyName;
        await playActionAnimations(root, c.lastAction, label, true);
        engine.clearCombatLastAction();
      }
    }
    busy = false;
    return;
  }

  if ((enemyJustActed || enemyPhaseContinues) && combat.lastAction) {
    busy = true;
    updateCombatDom(root, state);
    await playActionAnimations(root, combat.lastAction, enemyName, true);
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
