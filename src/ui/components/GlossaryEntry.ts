import { AssetImage } from './AssetImage';
import { TagChips } from './TagChips';

export interface GlossaryEntryOptions {
  title: string;
  description: string;
  imageKey?: string;
  tags?: string[];
  meta?: string[];
  details?: string[];
}

export function GlossaryEntry(options: GlossaryEntryOptions): HTMLElement {
  const el = document.createElement('article');
  el.className = 'glossary-entry';
  el.dataset.glossaryTitle = options.title.toLowerCase();

  if (options.imageKey) {
    el.appendChild(AssetImage(options.imageKey, 'glossary-entry__image', options.title));
  }

  const body = document.createElement('div');
  body.className = 'glossary-entry__body';

  const title = document.createElement('h3');
  title.className = 'glossary-entry__title';
  title.textContent = options.title;
  body.appendChild(title);

  if (options.meta && options.meta.length > 0) {
    const meta = document.createElement('p');
    meta.className = 'glossary-entry__meta';
    meta.textContent = options.meta.join(' · ');
    body.appendChild(meta);
  }

  if (options.tags && options.tags.length > 0) {
    body.appendChild(TagChips(options.tags));
  }

  const desc = document.createElement('p');
  desc.className = 'glossary-entry__desc';
  desc.textContent = options.description;
  body.appendChild(desc);

  if (options.details) {
    const list = document.createElement('ul');
    list.className = 'glossary-entry__details';
    for (const line of options.details) {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    }
    body.appendChild(list);
  }

  el.appendChild(body);
  return el;
}
