export interface TooltipSection {
  type?: 'title' | 'body' | 'meta';
  text: string;
}

export interface TooltipOptions {
  variant?: 'default' | 'action' | 'panel' | 'badge';
}

function fillTooltip(el: HTMLElement, content: string | TooltipSection[]): void {
  if (typeof content === 'string') {
    el.textContent = content;
    return;
  }

  el.classList.add('tooltip--rich');
  for (const section of content) {
    const part = document.createElement('div');
    part.className = `tooltip__${section.type ?? 'body'}`;
    part.textContent = section.text;
    el.appendChild(part);
  }
}

export function Tooltip(
  content: string | TooltipSection[],
  child: HTMLElement,
  options: TooltipOptions = {},
): HTMLElement {
  const wrap = document.createElement('span');
  const variant = options.variant ?? 'default';
  wrap.className =
    variant === 'action'
      ? 'tooltip-wrap tooltip-wrap--action'
      : variant === 'panel'
        ? 'tooltip-wrap tooltip-wrap--panel'
        : variant === 'badge'
          ? 'tooltip-wrap tooltip-wrap--badge'
          : 'tooltip-wrap';

  const tip = document.createElement('span');
  const tipClass =
    variant === 'action'
      ? 'tooltip tooltip--action'
      : variant === 'panel'
        ? 'tooltip tooltip--panel'
        : variant === 'badge'
          ? 'tooltip tooltip--badge'
          : 'tooltip';
  tip.className = tipClass;
  tip.setAttribute('role', 'tooltip');
  fillTooltip(tip, content);

  wrap.appendChild(child);
  wrap.appendChild(tip);
  return wrap;
}

export function showToast(message: string, duration = 3000): void {
  const existing = document.querySelector('.toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}
