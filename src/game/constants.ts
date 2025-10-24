export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const FLOOR_Y = GAME_HEIGHT - 72;

export const PLAYER_SPEED = 200;
export const PLAYER_JUMP = 520;
export const GRAVITY = 1500;

export const BULLET_SPEED = 600;
export const BULLET_LIFETIME = 1.2;

export const ENEMY_SPEED = 90;
export const ENEMY_SPAWN_INTERVAL = 2.5;
export const ENEMY_BASE_HEALTH = 3;

export const SKY_ENEMY_SPAWN_INTERVAL = 3.5;
export const SKY_ENEMY_MIN_Y = FLOOR_Y - 220;
export const SKY_ENEMY_MAX_Y = FLOOR_Y - 120;

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
  },
  big: {
    speed: 150,
    health: 3,
    bodyColor: 0xff6f91,
    accentColor: 0x232942,
    bobAmplitude: 30,
    shotColor: 0xff5b5b,
    fireIntervalMin: 1.6,
    fireIntervalMax: 2.6,
    shotSpeed: 320,
    shotRadius: 6,
    width: 44,
    height: 26,
  },
} as const;

export const PICKUP_DROP_CHANCE = 0.35;
export const PICKUP_SPEED = 80;
export const PICKUP_LIFETIME = 12;
