import type { ClassDef, WeaponDef, SkillDef, EnemyDef, SynergyDef } from '../types/definitions';
import type { EventDef } from '../types/events';
import { allClasses } from './classes';
import { allWeapons } from './weapons';
import { allSkills } from './skills';
import { allEnemies } from './enemies';
import { allSynergies } from './synergies';
import { allEvents } from './events';

const classMap = new Map(allClasses.map((c) => [c.id, c]));
const weaponMap = new Map(allWeapons.map((w) => [w.id, w]));
const skillMap = new Map(allSkills.map((s) => [s.id, s]));
const enemyMap = new Map(allEnemies.map((e) => [e.id, e]));
const synergyMap = new Map(allSynergies.map((s) => [s.id, s]));
const eventMap = new Map(allEvents.map((e) => [e.id, e]));

export function getClass(id: string): ClassDef | undefined {
  return classMap.get(id);
}

export function getAllClasses(): ClassDef[] {
  return allClasses;
}

export function getWeapon(id: string): WeaponDef | undefined {
  return weaponMap.get(id);
}

export function getWeaponsForClass(classId: string): WeaponDef[] {
  return allWeapons.filter((w) => w.classId === classId);
}

export function getAllWeapons(): WeaponDef[] {
  return allWeapons;
}

export function getSkill(id: string): SkillDef | undefined {
  return skillMap.get(id);
}

export function getAllSkills(): SkillDef[] {
  return allSkills;
}

export function getAttacksForWeapon(weaponId: string): SkillDef[] {
  return allSkills.filter((s) => s.type === 'attack' && s.weaponId === weaponId);
}

export function getPassivesForClass(classId: string): SkillDef[] {
  return allSkills.filter((s) => s.type === 'passive' && s.classId === classId);
}

export function getEnemy(id: string): EnemyDef | undefined {
  return enemyMap.get(id);
}

export function getAllEnemies(): EnemyDef[] {
  return allEnemies;
}

export function getSynergy(id: string): SynergyDef | undefined {
  return synergyMap.get(id);
}

export function getAllSynergies(): SynergyDef[] {
  return allSynergies;
}

export function getEvent(id: string): EventDef | undefined {
  return eventMap.get(id);
}

export function getAllEvents(): EventDef[] {
  return allEvents;
}

export function getFloorEvents(): EventDef[] {
  return allEvents.filter((e) => e.id !== 'boss');
}
