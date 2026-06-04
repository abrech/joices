export const SCREEN_TRANSITION_MS = 220;
export const PLAYER_ACTION_ANIM_MS = 550;
export const ENEMY_ACTION_ANIM_MS = 600;
export const ENEMY_CHARGED_ACTION_ANIM_MS = 750;
export const ENEMY_TURN_BANNER_MS = 400;
export const VICTORY_ANIM_MS = 900;
export const DEFEAT_ANIM_MS = 700;
export const REDUCED_MOTION_MS = 50;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animMs(normal: number): number {
  return prefersReducedMotion() ? REDUCED_MOTION_MS : normal;
}
