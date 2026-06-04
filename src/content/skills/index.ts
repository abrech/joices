import { longswordAttacks } from './attacks/longsword';
import { warhammerAttacks } from './attacks/warhammer';
import { arcaneStaffAttacks } from './attacks/arcane-staff';
import { focusWandAttacks } from './attacks/focus-wand';
import { twinDaggersAttacks } from './attacks/twin-daggers';
import { handCrossbowAttacks } from './attacks/hand-crossbow';
import { warriorPassives } from './passives/warrior';
import { magePassives } from './passives/mage';
import { roguePassives } from './passives/rogue';

export const allAttacks = [
  ...longswordAttacks,
  ...warhammerAttacks,
  ...arcaneStaffAttacks,
  ...focusWandAttacks,
  ...twinDaggersAttacks,
  ...handCrossbowAttacks,
];

export const allPassives = [...warriorPassives, ...magePassives, ...roguePassives];

export const allSkills = [...allAttacks, ...allPassives];
