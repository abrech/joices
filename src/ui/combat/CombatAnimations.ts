import type { CombatLastAction } from '../../types/game-state';
import {
  animMs,
  ENEMY_ACTION_ANIM_MS,
  ENEMY_CHARGED_ACTION_ANIM_MS,
  PLAYER_ACTION_ANIM_MS,
} from '../animation/timing';

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

export function setActionBanner(root: HTMLElement, text: string): void {
  const banner = root.querySelector<HTMLElement>('[data-turn-banner]');
  if (!banner) return;
  banner.textContent = text;
  root.dataset.actionBanner = 'true';
  banner.hidden = false;
}

export function hideActionBanner(root: HTMLElement): void {
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

export function playActionAnimations(
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
