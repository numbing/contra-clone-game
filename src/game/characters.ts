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
    id: 'atlas',
    name: 'Atlas Creed',
    codename: 'Titan',
    description: 'Front-line commando wielding a twin-core rail cannon.',
    baseWeapon: 'goliath',
    bodyColor: 0x5f96ff,
    accentColor: 0x2c3f73,
    speedMultiplier: 0.95,
    jumpMultiplier: 1,
  },
  {
    id: 'nova',
    name: 'Nova Seraph',
    codename: 'Aurora',
    description: 'Aerial ace launching prismatic aurora spears.',
    baseWeapon: 'aurora',
    bodyColor: 0xff8bb5,
    accentColor: 0x5e2f68,
    speedMultiplier: 1.05,
    jumpMultiplier: 1.05,
  },
  {
    id: 'k9',
    name: 'ROOK-9',
    codename: 'Howler',
    description: 'Cybernetic dog soldier firing sonic boomerangs.',
    baseWeapon: 'howler',
    bodyColor: 0xd37c45,
    accentColor: 0x3a2c2b,
    speedMultiplier: 1,
    jumpMultiplier: 1.1,
  },
  {
    id: 'astra',
    name: 'ASTRA-7',
    codename: 'Ionheart',
    description: 'Armored synth unleashing ionized micro missiles.',
    baseWeapon: 'ion',
    bodyColor: 0x6cb5ff,
    accentColor: 0x1a2745,
    speedMultiplier: 0.9,
    jumpMultiplier: 0.95,
  },
];

export function getCharacterByIndex(index: number): CharacterDefinition {
  return CHARACTERS[((index % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length];
}
