export function TagChips(tags: string[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'tag-chips';
  if (tags.length === 0) return row;

  for (const tag of tags) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = tag;
    row.appendChild(chip);
  }

  return row;
}

export function formatTagsLine(tags: string[]): string {
  if (tags.length === 0) return '';
  return `Tags: ${tags.join(', ')}`;
}
