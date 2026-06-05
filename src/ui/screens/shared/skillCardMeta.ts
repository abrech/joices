import type { SkillDef } from '../../../types/definitions';

export function skillTypeLabel(type: SkillDef['type']): string {
  return type === 'attack' ? 'Attack' : 'Passive';
}
