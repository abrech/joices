import type { SkillPickPayload } from '../types/events';
import type { GameState, RunActionPayload } from '../types/game-state';
import {
  createEmptyProfile,
  createInitialRunState,
} from '../types/game-state';
import { profileStore } from './profile/ProfileStore';
import {
  resolveEnemyTurn as runEnemyTurn,
  clearCombatLastAction,
} from './combat/CombatEngine';
import { appendAction } from './logging/RunLogger';
import {
  applySelectClass,
  applySelectWeapon,
  applyPickFloor,
  applyCombatSkill,
  applyCombatEndTurn,
  applyClaimLoot,
  applyLootSkillReward,
  applySkipCombatLootSkillPick,
  applySkipLootSkillReward,
  applySelectSkill,
  openCombatLoot,
} from './RunCommands';
import { completeEvent } from './events/EventResolver';
import { purchaseShopItem } from './shop/ShopPurchase';

export type GameListener = (state: GameState) => void;

export class GameEngine {
  private state: GameState;
  private listeners: GameListener[] = [];

  constructor() {
    const profile = profileStore.load();
    this.state = {
      run: createInitialRunState(Date.now()),
      profile: profile.version ? profile : createEmptyProfile(),
    };
  }

  subscribe(listener: GameListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getState(): GameState {
    return this.state;
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }

  private commit(state: GameState, action?: RunActionPayload): void {
    const run = action ? appendAction(state.run, action) : state.run;
    this.state = { ...state, run };
    this.emit();
  }

  selectClass(classId: string): void {
    const next = applySelectClass(this.state, classId);
    if (next === this.state) return;
    this.commit(next, { kind: 'selectClass', classId });
  }

  selectWeapon(weaponId: string): void {
    if (this.state.run.phase !== 'weaponSelect') return;
    const next = applySelectWeapon(this.state, weaponId);
    this.commit(next, { kind: 'selectWeapon', weaponId });
  }

  selectFloorOption(index: number): void {
    const option = this.state.run.floorOptions[index];
    if (!option || this.state.run.phase !== 'floorChoice') return;
    const next = applyPickFloor(this.state, index);
    this.commit(next, { kind: 'pickFloor', index, eventId: option.eventId });
  }

  confirmHeal(): void {
    this.commit(completeEvent(this.state), { kind: 'confirmHeal' });
  }

  selectSkill(skillId: string): void {
    const next = applySelectSkill(this.state, skillId);
    this.commit(next, { kind: 'selectSkill', skillId });
  }

  skipSkillPick(): void {
    const payload = this.state.run.activeEvent?.payload as SkillPickPayload | undefined;
    if (payload?.afterCombatLoot) {
      const next = applySkipCombatLootSkillPick(this.state);
      if (next !== this.state) {
        this.commit(next, { kind: 'skipSkillPick' });
      }
      return;
    }
    this.commit(completeEvent(this.state, '__skip__'), { kind: 'skipSkillPick' });
  }

  skipLootSkillReward(): void {
    const next = applySkipLootSkillReward(this.state);
    if (next === this.state) return;
    this.commit(next, { kind: 'skipSkillPick' });
  }

  buyShopItem(itemId: string): void {
    this.commit(purchaseShopItem(this.state, itemId), { kind: 'buyShop', itemId });
  }

  leaveShop(): void {
    this.commit(completeEvent(this.state, '__leave__'), { kind: 'leaveShop' });
  }

  combatUseSkill(skillId: string): void {
    const next = applyCombatSkill(this.state, skillId);
    this.handleCombatEnd(next, { kind: 'combatSkill', skillId });
  }

  combatEndTurn(): void {
    const next = applyCombatEndTurn(this.state);
    this.handleCombatEnd(next, { kind: 'combatEndTurn' });
  }

  resolveEnemyTurn(): void {
    const run = runEnemyTurn(this.state.run);
    this.handleCombatEnd({ ...this.state, run });
  }

  clearCombatLastAction(): void {
    this.commit({ ...this.state, run: clearCombatLastAction(this.state.run) });
  }

  combatVictoryContinue(): void {
    this.commit(openCombatLoot(this.state));
  }

  combatDefeatContinue(): void {
    const run = this.state.run;
    if (!run.combat?.finished || run.combat.result !== 'lose') return;
    this.commit(completeEvent({ ...this.state, run }, undefined, 'lose'), {
      kind: 'combatDefeatContinue',
    });
  }

  claimLoot(): void {
    const next = applyClaimLoot(this.state);
    this.commit(next, { kind: 'claimLoot' });
  }

  pickLootSkillReward(skillId: string): void {
    const next = applyLootSkillReward(this.state, skillId);
    if (next === this.state) return;
    this.commit(next, { kind: 'selectSkill', skillId });
  }

  private handleCombatEnd(state: GameState, action?: RunActionPayload): void {
    if (!state.run.combat?.finished) {
      this.commit(state, action);
      return;
    }
    this.commit(state, action);
  }

  clearSynergyToast(): void {
    this.commit({
      ...this.state,
      run: { ...this.state.run, newSynergyToast: undefined },
    });
  }

  restart(): void {
    const profile = this.state.profile;
    this.state = {
      run: createInitialRunState(Date.now()),
      profile,
    };
    this.emit();
  }

  /** Latest persisted run log for export on game over (if this run was saved). */
  getLastRunRecord() {
    return this.state.profile.runLogs?.[0] ?? null;
  }
}

export const gameEngine = new GameEngine();
