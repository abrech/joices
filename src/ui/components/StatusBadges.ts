import type { StatusInstance } from '../../types/game-state';

const STATUS_LABELS: Record<StatusInstance['type'], string> = {
  bleed: 'Bleed',
  burn: 'Burn',
  poison: 'Poison',
  stun: 'Stun',
};

export interface StatusBadgesOptions {
  statuses: StatusInstance[];
  dodgeNext?: boolean;
  stunned?: boolean;
}

export function StatusBadges(options: StatusBadgesOptions): HTMLElement {
  const { statuses, dodgeNext, stunned } = options;
  const hasContent = statuses.length > 0 || dodgeNext || stunned;

  const row = document.createElement('div');
  row.className = 'status-badges';
  if (!hasContent) return row;

  for (const s of statuses) {
    const badge = document.createElement('span');
    badge.className = `status-badge status-badge--${s.type}`;
    const stacks = s.stacks > 1 ? ` ×${s.stacks}` : '';
    badge.textContent = `${STATUS_LABELS[s.type]}${stacks} · ${s.duration}t`;
    badge.title = `${STATUS_LABELS[s.type]}: ${s.stacks} stack(s), ${s.duration} turn(s) left`;
    row.appendChild(badge);
  }

  if (dodgeNext) {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--buff';
    badge.textContent = 'Dodge next';
    badge.title = 'Next incoming attack will be dodged';
    row.appendChild(badge);
  }

  if (stunned) {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--stun';
    badge.textContent = 'Stunned';
    badge.title = 'Cannot act this turn';
    row.appendChild(badge);
  }

  return row;
}
