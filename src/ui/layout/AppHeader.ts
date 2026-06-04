import { getAppView, setAppView, type AppView } from '../navigation/appView';

function navLink(label: string, view: AppView, active: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'app-header__link' + (active ? ' app-header__link--active' : '');
  btn.textContent = label;
  btn.addEventListener('click', () => setAppView(view));
  return btn;
}

export function AppHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  const brand = document.createElement('span');
  brand.className = 'app-header__brand';
  brand.textContent = 'Joices';

  const nav = document.createElement('nav');
  nav.className = 'app-header__nav';
  const current = getAppView();
  nav.appendChild(navLink('Play', 'game', current === 'game'));
  nav.appendChild(navLink('Glossary', 'glossary', current === 'glossary'));

  header.appendChild(brand);
  header.appendChild(nav);
  return header;
}
