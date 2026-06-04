export type AppView = 'game' | 'glossary';

let view: AppView = 'game';
const listeners = new Set<() => void>();

export function getAppView(): AppView {
  return view;
}

export function setAppView(next: AppView): void {
  if (view === next) return;
  view = next;
  for (const fn of listeners) fn();
}

export function subscribeAppView(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
