import type { GameState } from '../types/game-state';
import type { CombatPayload, LootPayload } from '../types/events';
import {
  createEmptyProfile,
  createInitialRunState,
} from '../types/game-state';
import { createPlayer } from './createPlayer';
import { generateFloorOptions } from './progression/FloorGenerator';
import { beginEvent, completeEvent } from './events/EventResolver';
import { profileStore } from './profile/ProfileStore';
import { playerAttack, useSkill, applyCombatStartPassives } from './combat/CombatEngine';
import { rollCombatLoot, lootToEffects } from './loot/LootRoller';
import { applyEffects } from './effects/EffectApplier';
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

  private setState(state: GameState): void {
    this.state = state;
    this.emit();
  }

  selectClass(classId: string): void {
    if (this.state.run.phase !== 'classSelect') return;
    this.setState({
      ...this.state,
      run: { ...this.state.run, phase: 'weaponSelect', player: { ...this.state.run.player, classId } },
    });
  }

  selectWeapon(weaponId: string): void {
    if (this.state.run.phase !== 'weaponSelect') return;
    const { classId } = this.state.run.player;
    const player = createPlayer(classId, weaponId, this.state.profile);
    const run = {
      ...this.state.run,
      player,
      phase: 'floorChoice' as const,
      floor: 1,
      pacing: { combatsThisRun: 0 },
    };
    run.floorOptions = generateFloorOptions(run);
    this.setState({ ...this.state, run });
  }

  selectFloorOption(index: number): void {
    if (this.state.run.phase !== 'floorChoice') return;
    const option = this.state.run.floorOptions[index];
    if (!option) return;

    let state = beginEvent(this.state, option.eventId, option.payload);

    if (state.run.combat) {
      state = { ...state, run: applyCombatStartPassives(state.run) };
    }

    this.setState(state);
  }

  confirmHeal(): void {
    this.setState(completeEvent(this.state));
  }

  selectSkill(skillId: string): void {
    this.setState(completeEvent(this.state, skillId));
  }

  skipSkillPick(): void {
    this.setState(completeEvent(this.state, '__skip__'));
  }

  buyShopItem(itemId: string): void {
    this.setState(purchaseShopItem(this.state, itemId));
  }

  leaveShop(): void {
    this.setState(completeEvent(this.state, '__leave__'));
  }

  combatAttack(): void {
    const run = playerAttack(this.state.run);
    this.handleCombatEnd(run);
  }

  combatUseSkill(skillId: string): void {
    const run = useSkill(this.state.run, skillId);
    this.handleCombatEnd(run);
  }

  private handleCombatEnd(run: import('../types/game-state').RunState): void {
    if (!run.combat?.finished) {
      this.setState({ ...this.state, run });
      return;
    }

    const result = run.combat.result;
    if (result === 'lose') {
      this.setState(completeEvent({ ...this.state, run }, undefined, 'lose'));
      return;
    }

    if (result === 'win') {
      const active = run.activeEvent;
      const combatPayload = (active?.eventPayload ?? active?.payload) as CombatPayload;
      let state: GameState = { ...this.state, run };
      const { loot, state: afterRoll } = rollCombatLoot(state, combatPayload);
      state = afterRoll;

      const combatPayloadStored = active?.eventPayload ?? active?.payload;
      const runWithLoot = {
        ...state.run,
        combat: undefined,
        activeEvent: active
          ? {
              eventId: active.eventId,
              screen: 'loot' as const,
              payload: loot,
              eventPayload: combatPayloadStored,
            }
          : undefined,
      };

      this.setState({ ...state, run: runWithLoot });
      return;
    }

    this.setState({ ...this.state, run });
  }

  claimLoot(): void {
    const { activeEvent } = this.state.run;
    if (!activeEvent || activeEvent.screen !== 'loot') return;

    const loot = activeEvent.payload as LootPayload;
    const combatPayload = activeEvent.eventPayload ?? activeEvent.payload;

    let state = applyEffects(this.state, lootToEffects(loot.items));
    state = {
      ...state,
      run: {
        ...state.run,
        activeEvent: {
          eventId: activeEvent.eventId,
          screen: 'combat',
          payload: combatPayload,
        },
      },
    };

    this.setState(completeEvent(state, undefined, 'win'));
  }

  clearSynergyToast(): void {
    this.setState({
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
}

export const gameEngine = new GameEngine();
