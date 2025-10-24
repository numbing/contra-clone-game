import { Container, Graphics, Rectangle } from 'pixi.js';
import { FLOOR_Y, PICKUP_LIFETIME, PICKUP_SPEED } from './constants';
import type { WeaponType } from './weapons';
import { getWeaponPickupColor } from './weapons';

export class WeaponPickup extends Container {
  private readonly body: Graphics;
  private readonly hitBox = new Rectangle(0, 0, 24, 24);
  private alive = false;
  private lifetime = 0;
  private bobTimer = 0;
  private type: WeaponType = 'rifle';
  private mode: 'float' | 'drop' = 'float';
  private velocityX = 0;
  private velocityY = 0;
  private gravity = 0;
  private floorY = FLOOR_Y - 10;

  constructor() {
    super();
    this.body = new Graphics();
    this.addChild(this.body);
    this.visible = false;
  }

  activate(
    x: number,
    y: number,
    type: WeaponType,
    options?: { mode?: 'float' | 'drop'; velocityX?: number; velocityY?: number; gravity?: number },
  ): void {
    this.position.set(x, y);
    this.type = type;
    this.alive = true;
    this.visible = true;
    this.lifetime = PICKUP_LIFETIME;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.mode = options?.mode ?? 'float';
    this.velocityX = options?.velocityX ?? -PICKUP_SPEED;
    this.velocityY = options?.velocityY ?? 0;
    this.gravity = options?.gravity ?? 0;

    const color = getWeaponPickupColor(type);

    this.body
      .clear()
      .beginFill(0xffffff, 0.85)
      .drawCircle(0, 0, 14)
      .endFill()
      .beginFill(color)
      .drawCircle(0, 0, 10)
      .endFill();
  }

  deactivate(): void {
    this.visible = false;
    this.alive = false;
    this.lifetime = 0;
  }

  consume(): WeaponType {
    const pickupType = this.type;
    this.deactivate();
    return pickupType;
  }

  update(deltaSeconds: number): void {
    if (!this.alive) {
      return;
    }

    if (this.mode === 'float') {
      this.bobTimer += deltaSeconds * 4;
      this.position.x += this.velocityX * deltaSeconds;
      this.position.y += Math.sin(this.bobTimer) * 0.8;
      this.lifetime -= deltaSeconds;

      if (this.lifetime <= 0 || this.position.x < -40) {
        this.deactivate();
      }
    } else {
      this.velocityY += this.gravity * deltaSeconds;
      this.position.x += this.velocityX * deltaSeconds;
      this.position.y += this.velocityY * deltaSeconds;
      if (this.position.y >= this.floorY) {
        this.position.y = this.floorY;
        this.velocityY = 0;
        this.gravity = 0;
        this.mode = 'float';
        this.velocityX = -PICKUP_SPEED * 0.4;
        this.lifetime = PICKUP_LIFETIME * 0.8;
      }
    }
  }

  isActive(): boolean {
    return this.alive;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    this.hitBox.x = this.position.x - this.hitBox.width / 2;
    this.hitBox.y = this.position.y - this.hitBox.height / 2;
    return {
      x: this.hitBox.x,
      y: this.hitBox.y,
      width: this.hitBox.width,
      height: this.hitBox.height,
    };
  }

  getType(): WeaponType {
    return this.type;
  }
}

export class PickupManager extends Container {
  private readonly pickups: WeaponPickup[] = [];

  update(deltaSeconds: number): void {
    for (const pickup of this.pickups) {
      pickup.update(deltaSeconds);
    }
  }

  spawn(x: number, y: number, type: WeaponType, options?: { drop?: boolean }): void {
    const pickup = this.obtain();
    if (options?.drop) {
      pickup.activate(x, y, type, {
        mode: 'drop',
        velocityX: -30,
        velocityY: -40,
        gravity: 380,
      });
    } else {
      pickup.activate(x, y - 18, type, {
        mode: 'float',
        velocityX: -PICKUP_SPEED,
      });
    }
  }

  forEachActive(callback: (pickup: WeaponPickup) => void): void {
    for (const pickup of this.pickups) {
      if (pickup.isActive()) {
        callback(pickup);
      }
    }
  }

  clear(): void {
    for (const pickup of this.pickups) {
      pickup.deactivate();
    }
  }

  private obtain(): WeaponPickup {
    const existing = this.pickups.find((pickup) => !pickup.isActive());
    if (existing) {
      return existing;
    }

    const created = new WeaponPickup();
    this.pickups.push(created);
    this.addChild(created);
    return created;
  }
}
