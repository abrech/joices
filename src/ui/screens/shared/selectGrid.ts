export interface SelectScreenShellOptions {
  title: string;
  subtitle?: string;
  forModal?: boolean;
}

/** Title + subtitle + staggered card grid shell used by pick/shop screens. */
export function createSelectScreenShell(
  options: SelectScreenShellOptions,
): { root: HTMLElement; grid: HTMLElement } {
  const root = document.createElement('div');

  if (!options.forModal) {
    const heading = document.createElement('h1');
    heading.className = 'screen-title';
    heading.textContent = options.title;
    root.appendChild(heading);

    if (options.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'screen-subtitle';
      subtitle.textContent = options.subtitle;
      root.appendChild(subtitle);
    }
  }

  const grid = document.createElement('div');
  grid.className = 'card-grid card-grid--stagger';
  root.appendChild(grid);

  return { root, grid };
}
