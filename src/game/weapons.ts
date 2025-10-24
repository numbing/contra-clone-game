import type { BulletSpawn } from './bullet';

export type WeaponType =
  | 'rifle'
  | 'spread'
  | 'laser'
  | 'rapid'
  | 'flame'
  | 'goliath'
  | 'aurora'
  | 'howler'
  | 'ion';

interface WeaponDefinition {
  label: string;
  cooldown: number;
  duration: number | null;
  pattern(origin: { x: number; y: number }, direction: number, aimAngle: number): BulletSpawn[];
  pickupColor: number;
}

const DEG_TO_RAD = Math.PI / 180;
const ANGLE_EPSILON = 0.0001;

function clampAngle(angle: number): number {
  const limit = Math.PI / 2 - ANGLE_EPSILON;
  return Math.max(-limit, Math.min(limit, angle));
}

function makeBullet(
  origin: { x: number; y: number },
  direction: number,
  angle: number,
  overrides: Omit<BulletSpawn, 'x' | 'y' | 'direction' | 'angle'>,
): BulletSpawn {
  return {
    x: origin.x,
    y: origin.y,
    direction: direction === 0 ? 1 : direction,
    angle: clampAngle(angle),
    ...overrides,
  };
}

const WEAPONS: Record<WeaponType, WeaponDefinition> = {
  rifle: {
    label: 'Rifle',
    cooldown: 0.18,
    duration: null,
    pickupColor: 0xfcee0c,
    pattern(origin, direction, aimAngle) {
      return [
        makeBullet(origin, direction, aimAngle, {
          speed: 620,
          color: 0xfcee0c,
          width: 12,
          height: 4,
          lifetime: 1.1,
          damage: 1,
          pierce: false,
        }),
      ];
    },
  },
  rapid: {
    label: 'Rapid',
    cooldown: 0.08,
    duration: 15,
    pickupColor: 0x89fffd,
    pattern(origin, direction, aimAngle) {
      return [
        makeBullet(origin, direction, aimAngle, {
          speed: 720,
          color: 0x89fffd,
          width: 10,
          height: 4,
          lifetime: 1.2,
          damage: 1,
          pierce: false,
        }),
      ];
    },
  },
  spread: {
    label: 'Spread',
    cooldown: 0.3,
    duration: 18,
    pickupColor: 0xff7b56,
    pattern(origin, direction, aimAngle) {
      const offsets = [-18, 0, 18];
      return offsets.map((offset) =>
        makeBullet(origin, direction, aimAngle + offset * DEG_TO_RAD, {
          speed: 560,
          color: 0xff7b56,
          width: 12,
          height: 5,
          lifetime: 1.2,
          damage: 1,
          pierce: false,
        }),
      );
    },
  },
  laser: {
    label: 'Laser',
    cooldown: 0.45,
    duration: 12,
    pickupColor: 0x9b6bff,
    pattern(origin, direction, aimAngle) {
      return [
        makeBullet(origin, direction, aimAngle, {
          speed: 900,
          color: 0x9b6bff,
          width: 6,
          height: 18,
          lifetime: 1.4,
          damage: 3,
          pierce: true,
        }),
      ];
    },
  },
  flame: {
    label: 'Flame',
    cooldown: 0.22,
    duration: 16,
    pickupColor: 0xff6f6f,
    pattern(origin, direction, aimAngle) {
      const offsets = [-12, 0, 12];
      return offsets.map((offset, index) =>
        makeBullet(origin, direction, aimAngle + offset * DEG_TO_RAD, {
          speed: 520 - index * 50,
          color: 0xff6f6f,
          width: 12,
          height: 6,
          lifetime: 1.4,
          damage: 1,
          pierce: false,
        }),
      );
    },
  },
  goliath: {
    label: 'Goliath',
    cooldown: 0.28,
    duration: null,
    pickupColor: 0x5f96ff,
    pattern(origin, direction, aimAngle) {
      const offsets = [-4, 4];
      return offsets.map((offset) =>
        makeBullet(
          { x: origin.x, y: origin.y + offset },
          direction,
          aimAngle + offset * 0.01,
          {
            speed: 760,
            color: 0x9ed0ff,
            width: 14,
            height: 6,
            lifetime: 1.4,
            damage: 2,
            pierce: true,
          },
        ),
      );
    },
  },
  aurora: {
    label: 'Aurora',
    cooldown: 0.26,
    duration: null,
    pickupColor: 0xff8bb5,
    pattern(origin, direction, aimAngle) {
      const offsets = [-0.35, 0, 0.35];
      return offsets.map((offset, index) =>
        makeBullet(origin, direction, aimAngle - offset, {
          speed: 540 + index * 40,
          color: 0xffc0e1,
          width: 8,
          height: 14,
          lifetime: 1.3,
          damage: 1,
          pierce: false,
        }),
      );
    },
  },
  howler: {
    label: 'Howler',
    cooldown: 0.3,
    duration: null,
    pickupColor: 0xd37c45,
    pattern(origin, direction) {
      const angles = [-0.5, -0.2, 0.2];
      return angles.map((angle, idx) =>
        makeBullet(origin, direction, angle, {
          speed: 520 - idx * 60,
          color: 0xfff18c,
          width: 10,
          height: 5,
          lifetime: 1.2,
          damage: 1,
          pierce: false,
        }),
      );
    },
  },
  ion: {
    label: 'Ionheart',
    cooldown: 0.34,
    duration: null,
    pickupColor: 0x6cb5ff,
    pattern(origin, direction, aimAngle) {
      const offsets = [-0.25, -0.1, 0.1, 0.25];
      return offsets.map((offset) =>
        makeBullet(origin, direction, aimAngle + offset, {
          speed: 600,
          color: 0xb5f1ff,
          width: 8,
          height: 8,
          lifetime: 1.5,
          damage: 1,
          pierce: true,
        }),
      );
    },
  },
};

export function getWeaponDefinition(type: WeaponType): WeaponDefinition {
  return WEAPONS[type];
}

export function getWeaponLabel(type: WeaponType): string {
  return WEAPONS[type].label;
}

export function getWeaponDuration(type: WeaponType): number | null {
  return WEAPONS[type].duration;
}

export function getWeaponCooldown(type: WeaponType): number {
  return WEAPONS[type].cooldown;
}

export function getWeaponPickupColor(type: WeaponType): number {
  return WEAPONS[type].pickupColor;
}

export function getRandomWeapon(): WeaponType {
  const pool: WeaponType[] = ['spread', 'rapid', 'laser', 'flame'];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
