import { AssetImage } from './AssetImage';
import { TagChips } from './TagChips';

export interface CardOptions {
  title: string;
  description: string;
  imageKey: string;
  tags?: string[];
  preview?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function Card(options: CardOptions): HTMLElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'card' + (options.disabled ? ' card--disabled' : '');

  el.appendChild(AssetImage(options.imageKey, 'card__image', options.title));

  const title = document.createElement('div');
  title.className = 'card__title';
  title.textContent = options.title;

  const desc = document.createElement('div');
  desc.className = 'card__desc';
  desc.textContent = options.description;

  el.appendChild(title);

  if (options.tags && options.tags.length > 0) {
    el.appendChild(TagChips(options.tags));
  }

  el.appendChild(desc);

  if (options.preview) {
    const preview = document.createElement('div');
    preview.className = 'card__desc';
    preview.style.color = 'var(--warning)';
    preview.style.marginTop = '0.5rem';
    preview.textContent = options.preview;
    el.appendChild(preview);
  }

  if (!options.disabled && options.onClick) {
    el.addEventListener('click', options.onClick);
  }

  return el;
}
