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
} as const;

export type GroundEnemyVariantId = keyof typeof GROUND_ENEMY_VARIANTS;

export const PICKUP_DROP_CHANCE = 0.32;
export const PICKUP_SPEED = 80;
export const PICKUP_LIFETIME = 12;

export const BACKGROUND_SWITCH_TIME = 38;

export const BOSS_CONFIG = {
  health: 160,
  colorPrimary: 0xff4159,
  colorAccent: 0x1b1c3a,
  shotColor: 0xffd34d,
  shotSpeed: 360,
  slamInterval: 4.8,
} as const;
