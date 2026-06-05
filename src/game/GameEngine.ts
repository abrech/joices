import type { GameState, RunActionPayload } from '../types/game-state';
import {
  createEmptyProfile,
  createInitialRunState,
} from '../types/game-state';
import { profileStore } from './profile/ProfileStore';
import { appendAction } from './logging/RunLogger';
import { applyClaimLoot, applyLootSkillReward, openCombatLoot } from './RunCommands';
import { dispatchAction } from './dispatch';
import { advanceCombat } from './combat/advanceCombat';
import { clearCombatLastAction } from './combat/CombatEngine';

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
    const next = dispatchAction(this.state, { kind: 'selectClass', classId });
    if (next === this.state) return;
    this.commit(next, { kind: 'selectClass', classId });
  }

  selectWeapon(weaponId: string): void {
    if (this.state.run.phase !== 'weaponSelect') return;
    const next = dispatchAction(this.state, { kind: 'selectWeapon', weaponId });
    this.commit(next, { kind: 'selectWeapon', weaponId });
  }

  selectFloorOption(index: number): void {
    const option = this.state.run.floorOptions[index];
    if (!option || this.state.run.phase !== 'floorChoice') return;
    const next = dispatchAction(this.state, { kind: 'pickFloor', index, eventId: option.eventId });
    this.commit(next, { kind: 'pickFloor', index, eventId: option.eventId });
  }

  confirmHeal(): void {
    this.commit(dispatchAction(this.state, { kind: 'confirmHeal' }), { kind: 'confirmHeal' });
  }

  selectSkill(skillId: string): void {
    const next = dispatchAction(this.state, { kind: 'selectSkill', skillId });
    this.commit(next, { kind: 'selectSkill', skillId });
  }

  skipSkillPick(): void {
    const next = dispatchAction(this.state, { kind: 'skipSkillPick' });
    if (next === this.state) return;
    this.commit(next, { kind: 'skipSkillPick' });
  }

  skipLootSkillReward(): void {
    const next = dispatchAction(this.state, { kind: 'skipSkillPick' });
    if (next === this.state) return;
    this.commit(next, { kind: 'skipSkillPick' });
  }

  buyShopItem(itemId: string): void {
    this.commit(dispatchAction(this.state, { kind: 'buyShop', itemId }), { kind: 'buyShop', itemId });
  }

  leaveShop(): void {
    this.commit(dispatchAction(this.state, { kind: 'leaveShop' }), { kind: 'leaveShop' });
  }

  combatUseSkill(skillId: string): void {
    const next = advanceCombat(this.state, 'playerSkill', skillId);
    this.commit(next, { kind: 'combatSkill', skillId });
  }

  combatEndTurn(): void {
    const next = advanceCombat(this.state, 'endPlayerTurn');
    this.commit(next, { kind: 'combatEndTurn' });
  }

  resolveEnemyTurn(): void {
    const next = advanceCombat(this.state, 'enemyStep');
    this.commit(next);
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
    this.commit(dispatchAction(this.state, { kind: 'combatDefeatContinue' }), {
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
