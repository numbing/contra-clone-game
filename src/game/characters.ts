import type { WeaponType } from './weapons';

export interface CharacterDefinition {
  id: string;
  name: string;
  codename: string;
  description: string;
  baseWeapon: WeaponType;
  bodyColor: number;
  accentColor: number;
  speedMultiplier: number;
  jumpMultiplier: number;
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'falcon',
    name: 'Benjamin',
    codename: 'Falcon',
    description: 'Balanced commando with rapid-fire machine gun.',
    baseWeapon: 'rapid',
    bodyColor: 0x4dd5ff,
    accentColor: 0x1d5d82,
    speedMultiplier: 1,
    jumpMultiplier: 1,
  },
  {
    id: 'phoenix',
    name: 'Sheena',
    codename: 'Phoenix',
    description: 'Spreads triple shots wide across the battlefield.',
    baseWeapon: 'spread',
    bodyColor: 0xffa763,
    accentColor: 0xb65a27,
    speedMultiplier: 0.95,
    jumpMultiplier: 1.05,
  },
  {
    id: 'quasar',
    name: 'Lance',
    codename: 'Quasar',
    description: 'Charged laser beams punch through heavy armor.',
    baseWeapon: 'laser',
    bodyColor: 0xc88bff,
    accentColor: 0x6c3ebd,
    speedMultiplier: 0.9,
    jumpMultiplier: 1.1,
  },
  {
    id: 'ember',
    name: 'Lucia',
    codename: 'Ember',
    description: 'Flame arcs climb upward to melt aerial squads.',
    baseWeapon: 'flame',
    bodyColor: 0xff6f6f,
    accentColor: 0xb42828,
    speedMultiplier: 1.05,
    jumpMultiplier: 0.95,
  },
];

export function getCharacterByIndex(index: number): CharacterDefinition {
  return CHARACTERS[((index % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length];
}
