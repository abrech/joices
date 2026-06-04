export interface ModalOverlayOptions {
  title: string;
  subtitle?: string;
  content: HTMLElement;
}

export function ModalOverlay(options: ModalOverlayOptions): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', options.title);

  const panel = document.createElement('div');
  panel.className = 'modal-panel';

  const title = document.createElement('h1');
  title.className = 'modal-panel__title';
  title.textContent = options.title;
  panel.appendChild(title);

  if (options.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'modal-panel__subtitle';
    subtitle.textContent = options.subtitle;
    panel.appendChild(subtitle);
  }

  panel.appendChild(options.content);
  overlay.appendChild(panel);
  return overlay;
}
