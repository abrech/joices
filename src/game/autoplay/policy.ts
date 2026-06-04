import type { GameState } from '../../types/game-state';
import { greedyPolicy } from './GreedyPolicy';
import { randomPolicy } from './RandomPolicy';

export type AutoplayPolicyName = 'greedy' | 'random';

export type ShopAction = { type: 'buy'; itemId: string } | { type: 'leave' };

export type SkillRewardAction = { type: 'pick'; skillId: string } | { type: 'skip' };

export interface AutoplayPolicy {
  readonly name: AutoplayPolicyName;
  selectClass(state: GameState): string;
  selectWeapon(state: GameState): string;
  selectFloorIndex(state: GameState): number;
  selectCombatSkill(state: GameState): string | null;
  selectSkillReward(
    state: GameState,
    skillIds: string[],
    context: 'loot' | 'training',
  ): SkillRewardAction;
  selectShopAction(state: GameState, itemIds: string[]): ShopAction;
}

export function getPolicy(name: AutoplayPolicyName): AutoplayPolicy {
  return name === 'greedy' ? greedyPolicy : randomPolicy;
}
