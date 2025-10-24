import { Container, Graphics, Rectangle } from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';

export interface BulletSpawn {
  x: number;
  y: number;
  direction: number;
  speed: number;
  angle?: number;
  color: number;
  width: number;
  height: number;
  lifetime: number;
  damage: number;
  pierce?: boolean;
}

export class Bullet extends Container {
  private readonly body: Graphics;
  private velocityX = 0;
  private velocityY = 0;
  private lifetime = 0;
  private damage = 1;
  private pierce = false;
  private readonly piercedEnemyIds = new Set<number>();
  private readonly hitBox = new Rectangle(0, 0, 0, 0);

  constructor() {
    super();

    this.body = new Graphics();
    this.addChild(this.body);
    this.visible = false;
  }

  fire(spawn: BulletSpawn): void {
    const angle = spawn.angle ?? 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    this.position.set(spawn.x, spawn.y);
    this.velocityX = spawn.direction * spawn.speed * cos;
    this.velocityY = -spawn.speed * sin;
    this.lifetime = spawn.lifetime;
    this.damage = spawn.damage;
    this.pierce = Boolean(spawn.pierce);
    this.piercedEnemyIds.clear();

    this.body
      .clear()
      .beginFill(spawn.color)
      .drawRect(-spawn.width / 2, -spawn.height / 2, spawn.width, spawn.height)
      .endFill();

    this.hitBox.width = spawn.width;
    this.hitBox.height = spawn.height;

    this.visible = true;
  }

  deactivate(): void {
    this.visible = false;
    this.lifetime = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.piercedEnemyIds.clear();
  }

  update(deltaSeconds: number): void {
    if (!this.visible) {
      return;
    }

    this.position.x += this.velocityX * deltaSeconds;
    this.position.y += this.velocityY * deltaSeconds;
    this.lifetime -= deltaSeconds;

    if (
      this.lifetime <= 0 ||
      this.position.x < -64 ||
      this.position.x > GAME_WIDTH + 64 ||
      this.position.y < -64 ||
      this.position.y > GAME_HEIGHT + 64
    ) {
      this.deactivate();
    }
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

  registerHit(enemyId: number): boolean {
    if (!this.visible) {
      return false;
    }

    if (!this.pierce) {
      this.deactivate();
      return true;
    }

    if (this.piercedEnemyIds.has(enemyId)) {
      return false;
    }

    this.piercedEnemyIds.add(enemyId);
    return true;
  }

  isPiercing(): boolean {
    return this.pierce;
  }
}

export class BulletManager extends Container {
  private readonly bullets: Bullet[] = [];

  spawn(spawn: BulletSpawn): void {
    const bullet = this.obtain();
    bullet.fire(spawn);
  }

  update(deltaSeconds: number): void {
    for (const bullet of this.bullets) {
      bullet.update(deltaSeconds);
    }
  }

  forEachActive(callback: (bullet: Bullet) => void): void {
    for (const bullet of this.bullets) {
      if (bullet.visible) {
        callback(bullet);
      }
    }
  }

  clear(): void {
    for (const bullet of this.bullets) {
      bullet.deactivate();
    }
  }

  private obtain(): Bullet {
    const bullet = this.bullets.find((entry) => !entry.visible);
    if (bullet) {
      return bullet;
    }

    const created = new Bullet();
    this.bullets.push(created);
    this.addChild(created);
    return created;
  }
}
