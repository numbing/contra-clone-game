import { Container, Graphics, Rectangle } from 'pixi.js';

export interface EnemyShotSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  damage: number;
  radius: number;
  color: number;
  gravity?: number;
}

class EnemyShot extends Container {
  private readonly body: Graphics;
  private readonly hitBox = new Rectangle(0, 0, 0, 0);
  private vx = 0;
  private vy = 0;
  private lifetime = 0;
  private damage = 1;
  private gravity = 0;

  constructor() {
    super();
    this.body = new Graphics();
    this.addChild(this.body);
    this.visible = false;
  }

  fire(spawn: EnemyShotSpawn): void {
    this.position.set(spawn.x, spawn.y);
    this.vx = spawn.vx;
    this.vy = spawn.vy;
    this.lifetime = spawn.lifetime;
    this.damage = spawn.damage;
    this.gravity = spawn.gravity ?? 0;

    this.body
      .clear()
      .beginFill(spawn.color)
      .drawCircle(0, 0, spawn.radius)
      .endFill();

    const diameter = spawn.radius * 2;
    this.hitBox.width = diameter;
    this.hitBox.height = diameter;

    this.visible = true;
  }

  update(deltaSeconds: number): void {
    if (!this.visible) {
      return;
    }

    this.position.x += this.vx * deltaSeconds;
    this.vy += this.gravity * deltaSeconds;
    this.position.y += this.vy * deltaSeconds;
    this.lifetime -= deltaSeconds;

    if (this.lifetime <= 0) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.visible = false;
    this.lifetime = 0;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
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

  getDamage(): number {
    return this.damage;
  }
}

export class EnemyProjectileManager extends Container {
  private readonly shots: EnemyShot[] = [];

  spawn(spawn: EnemyShotSpawn): void {
    const shot = this.obtain();
    shot.fire(spawn);
  }

  update(deltaSeconds: number): void {
    for (const shot of this.shots) {
      shot.update(deltaSeconds);
    }
  }

  forEachActive(callback: (shot: EnemyShot) => void): void {
    for (const shot of this.shots) {
      if (shot.visible) {
        callback(shot);
      }
    }
  }

  clear(): void {
    for (const shot of this.shots) {
      shot.deactivate();
    }
  }

  private obtain(): EnemyShot {
    const shot = this.shots.find((entry) => !entry.visible);
    if (shot) {
      return shot;
    }

    const created = new EnemyShot();
    this.shots.push(created);
    this.addChild(created);
    return created;
  }
}
