import type { StatusInstance } from '../../types/game-state';
import { Tooltip, type TooltipSection } from './Tooltip';

const STATUS_LABELS: Record<StatusInstance['type'], string> = {
  bleed: 'Bleed',
  burn: 'Burn',
  poison: 'Poison',
  stun: 'Stun',
  mark: 'Mark',
  weaken: 'Weaken',
};

const STATUS_HELP: Record<StatusInstance['type'], string> = {
  bleed: 'Deals damage each enemy turn. More stacks increase tick damage (3 per stack, before bonuses).',
  burn: 'Fire damage over time each enemy turn. More stacks increase tick damage (4 per stack). Inferno synergy boosts burn.',
  poison: 'Poison damage each enemy turn. Stacks add damage (2 per stack). Marked targets take 50% more poison damage.',
  stun: 'Stunned units skip their next action.',
  mark: 'Marked targets take 50% increased poison damage while the mark lasts.',
  weaken: 'Weakened attackers deal less damage (15% reduction per stack, up to 30%).',
};

function statusTooltipSections(s: StatusInstance): TooltipSection[] {
  const stackLine =
    s.stacks > 1 ? `${s.stacks} stacks` : `${s.stacks} stack`;
  return [
    { type: 'title', text: STATUS_LABELS[s.type] },
    { type: 'body', text: STATUS_HELP[s.type] },
    { type: 'meta', text: `${stackLine} · ${s.duration} turn(s) remaining` },
  ];
}

function wrapBadge(content: TooltipSection[], badge: HTMLElement): HTMLElement {
  return Tooltip(content, badge, { variant: 'badge' });
}

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
    row.appendChild(wrapBadge(statusTooltipSections(s), badge));
  }

  if (dodgeNext) {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--buff';
    badge.textContent = 'Dodge next';
    row.appendChild(
      wrapBadge(
        [
          { type: 'title', text: 'Dodge next' },
          {
            type: 'body',
            text: 'The next enemy attack against you will miss. Counter skills may still deal damage when you dodge.',
          },
        ],
        badge,
      ),
    );
  }

  if (stunned) {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--stun';
    badge.textContent = 'Stunned';
    row.appendChild(
      wrapBadge(
        [
          { type: 'title', text: 'Stunned' },
          { type: 'body', text: 'This enemy cannot attack on their next action in the enemy phase.' },
        ],
        badge,
      ),
    );
  }

  return row;
}
