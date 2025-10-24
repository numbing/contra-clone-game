import type { BulletSpawn } from './bullet';

export type WeaponType = 'rifle' | 'spread' | 'laser' | 'rapid';

interface WeaponDefinition {
  label: string;
  cooldown: number;
  duration: number | null;
  pattern(origin: { x: number; y: number }, facing: number): BulletSpawn[];
  pickupColor: number;
}

const DEG_TO_RAD = Math.PI / 180;

const WEAPONS: Record<WeaponType, WeaponDefinition> = {
  rifle: {
    label: 'Rifle',
    cooldown: 0.18,
    duration: null,
    pickupColor: 0xfcee0c,
    pattern(origin, facing) {
      return [
        {
          x: origin.x + facing * 20,
          y: origin.y,
          direction: facing,
          speed: 620,
          angle: 0,
          color: 0xfcee0c,
          width: 12,
          height: 4,
          lifetime: 1.1,
          damage: 1,
          pierce: false,
        },
      ];
    },
  },
  rapid: {
    label: 'Rapid',
    cooldown: 0.08,
    duration: 15,
    pickupColor: 0x89fffd,
    pattern(origin, facing) {
      return [
        {
          x: origin.x + facing * 20,
          y: origin.y - 2,
          direction: facing,
          speed: 720,
          angle: 0,
          color: 0x89fffd,
          width: 10,
          height: 4,
          lifetime: 1.2,
          damage: 1,
          pierce: false,
        },
      ];
    },
  },
  spread: {
    label: 'Spread',
    cooldown: 0.3,
    duration: 18,
    pickupColor: 0xff7b56,
    pattern(origin, facing) {
      const angles = [-18, 0, 18];
      const bullets: BulletSpawn[] = [];
      for (const angleDeg of angles) {
        bullets.push({
          x: origin.x + facing * 20,
          y: origin.y - 4,
          direction: facing,
          speed: 560,
          angle: angleDeg * DEG_TO_RAD,
          color: 0xff7b56,
          width: 12,
          height: 5,
          lifetime: 1.2,
          damage: 1,
          pierce: false,
        });
      }
      return bullets;
    },
  },
  laser: {
    label: 'Laser',
    cooldown: 0.45,
    duration: 12,
    pickupColor: 0x9b6bff,
    pattern(origin, facing) {
      return [
        {
          x: origin.x + facing * 24,
          y: origin.y - 6,
          direction: facing,
          speed: 900,
          angle: 0,
          color: 0x9b6bff,
          width: 6,
          height: 18,
          lifetime: 1.4,
          damage: 3,
          pierce: true,
        },
      ];
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
  const pool: WeaponType[] = ['spread', 'rapid', 'laser'];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
