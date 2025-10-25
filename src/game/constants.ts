import type { WeaponType } from './weapons';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const FLOOR_Y = GAME_HEIGHT - 72;

export const PLAYER_SPEED = 200;
export const PLAYER_JUMP = 520;
export const GRAVITY = 1500;

export const BULLET_SPEED = 600;
export const BULLET_LIFETIME = 1.2;

export const GROUND_ENEMY_SPAWN_INTERVAL = 2.2;
export const SKY_ENEMY_SPAWN_INTERVAL = 3.4;

export const SKY_ENEMY_MIN_Y = FLOOR_Y - 220;
export const SKY_ENEMY_MAX_Y = FLOOR_Y - 120;

export const LEVEL_THEMES = {
  jungleDawn: {
    sky: 0x10203b,
    horizon: 0x274068,
    ground: 0x1f5d3a,
    accent: 0x49a06b,
    decoration: 0x276f4c,
  },
  jungleDusk: {
    sky: 0x2b142f,
    horizon: 0x61365c,
    ground: 0x3a1f49,
    accent: 0x91406d,
    decoration: 0x5f2c49,
  },
  fortress: {
    sky: 0x070a16,
    horizon: 0x1f2b43,
    ground: 0x1b1f2c,
    accent: 0x485062,
    decoration: 0x2e3646,
  },
  cinderDawn: {
    sky: 0x2b1b14,
    horizon: 0x5a3021,
    ground: 0x3a261b,
    accent: 0xd97329,
    decoration: 0x5b3d2c,
  },
  cinderStorm: {
    sky: 0x1a1e2f,
    horizon: 0x39445b,
    ground: 0x242631,
    accent: 0x8fa1c2,
    decoration: 0x444f68,
  },
  cinderNight: {
    sky: 0x08090d,
    horizon: 0x3a1c32,
    ground: 0x1c1118,
    accent: 0xdb4c72,
    decoration: 0x552238,
  },
} as const;

export type LevelThemeId = keyof typeof LEVEL_THEMES;

export const SKY_ENEMY_VARIANTS = {
  small: {
    speed: 90,
    health: 2,
    bodyColor: 0x7ad8ff,
    accentColor: 0x23495c,
    bobAmplitude: 18,
    shotColor: 0xffd167,
    fireIntervalMin: 2.4,
    fireIntervalMax: 3.6,
    shotSpeed: 230,
    shotRadius: 4,
    width: 36,
    height: 20,
    weapon: 'rapid' as WeaponType,
  },
  big: {
    speed: 150,
    health: 4,
    bodyColor: 0xff6f91,
    accentColor: 0x232942,
    bobAmplitude: 30,
    shotColor: 0xff5b5b,
    fireIntervalMin: 1.8,
    fireIntervalMax: 3,
    shotSpeed: 320,
    shotRadius: 6,
    width: 44,
    height: 26,
    weapon: 'laser' as WeaponType,
  },
  ace: {
    speed: 190,
    health: 3,
    bodyColor: 0xffdd7a,
    accentColor: 0x5c3f0f,
    bobAmplitude: 22,
    shotColor: 0xffb347,
    fireIntervalMin: 1.6,
    fireIntervalMax: 2.4,
    shotSpeed: 360,
    shotRadius: 5,
    width: 48,
    height: 22,
    weapon: 'aurora' as WeaponType,
  },
  behemoth: {
    speed: 120,
    health: 6,
    bodyColor: 0x6fb0ff,
    accentColor: 0x1f3c68,
    bobAmplitude: 32,
    shotColor: 0xbfe4ff,
    fireIntervalMin: 1.4,
    fireIntervalMax: 2.2,
    shotSpeed: 280,
    shotRadius: 8,
    width: 64,
    height: 32,
    weapon: 'ion' as WeaponType,
  },
} as const;

export type SkyEnemyVariantId = keyof typeof SKY_ENEMY_VARIANTS;

export const GROUND_ENEMY_VARIANTS = {
  scout: {
    speed: 180,
    health: 2,
    color: 0x9acbff,
    stripe: 0x1e5ea8,
    ability: 'dash',
    fireInterval: 0,
    bulletSpeed: 0,
    dropWeapon: 'rapid' as WeaponType,
  },
  gunner: {
    speed: 120,
    health: 3,
    color: 0xff8b6a,
    stripe: 0x9f2d26,
    ability: 'shoot',
    fireInterval: 2.8,
    bulletSpeed: 280,
    dropWeapon: 'rifle' as WeaponType,
  },
  grenadier: {
    speed: 90,
    health: 4,
    color: 0xffda6a,
    stripe: 0xbb7a22,
    ability: 'lob',
    fireInterval: 3.6,
    bulletSpeed: 200,
    dropWeapon: 'flame' as WeaponType,
  },
  brute: {
    speed: 70,
    health: 6,
    color: 0xc06cff,
    stripe: 0x5d2a86,
    ability: 'shield',
    fireInterval: 0,
    bulletSpeed: 0,
    dropWeapon: null,
  },
  raider: {
    speed: 200,
    health: 3,
    color: 0xffc04d,
    stripe: 0x8a4f06,
    ability: 'dash',
    fireInterval: 0,
    bulletSpeed: 0,
    dropWeapon: 'thunder' as WeaponType,
  },
  shredder: {
    speed: 140,
    health: 4,
    color: 0x8df1ff,
    stripe: 0x2c8ea1,
    ability: 'shoot',
    fireInterval: 2.4,
    bulletSpeed: 320,
    dropWeapon: 'vortex' as WeaponType,
  },
  pyro: {
    speed: 110,
    health: 5,
    color: 0xff7b4d,
    stripe: 0x91240f,
    ability: 'lob',
    fireInterval: 3,
    bulletSpeed: 260,
    dropWeapon: 'flame' as WeaponType,
  },
} as const;

export type GroundEnemyVariantId = keyof typeof GROUND_ENEMY_VARIANTS;

export const PICKUP_DROP_CHANCE = 0.1;
export const PICKUP_SPEED = 80;
export const PICKUP_LIFETIME = 12;

export const BACKGROUND_SWITCH_TIME = 38;

export interface BossProfile {
  id: string;
  textureAlias: string;
  health: number;
  colorPrimary: number;
  colorAccent: number;
  shotColor: number;
  shotSpeed: number;
  slamInterval: number;
}

export const BOSS_PROFILES = {
  fortress: {
    id: 'fortress',
    textureAlias: 'boss-fortress',
    health: 160,
    colorPrimary: 0xff4159,
    colorAccent: 0x1b1c3a,
    shotColor: 0xffd34d,
    shotSpeed: 360,
    slamInterval: 4.8,
  },
  warlord: {
    id: 'warlord',
    textureAlias: 'boss-warlord',
    health: 220,
    colorPrimary: 0xff7e2b,
    colorAccent: 0x2a1a1d,
    shotColor: 0xfff6a0,
    shotSpeed: 420,
    slamInterval: 3.8,
  },
} as const;

export type BossProfileId = keyof typeof BOSS_PROFILES;
