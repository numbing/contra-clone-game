import { Container, Graphics } from 'pixi.js';
import {
  GAME_WIDTH,
  SKY_ENEMY_BASE_HEALTH,
  SKY_ENEMY_MAX_Y,
  SKY_ENEMY_MIN_Y,
  SKY_ENEMY_SPEED,
  SKY_ENEMY_SPAWN_INTERVAL,
} from './constants';

type SkyEnemyMode = 'patrol' | 'static';

export class SkyEnemy extends Container {
  private readonly body: Graphics;
  private alive = false;
  private health = SKY_ENEMY_BASE_HEALTH;
  private maxHealth = SKY_ENEMY_BASE_HEALTH;
  private id = 0;
  private mode: SkyEnemyMode = 'patrol';
  private baseY = SKY_ENEMY_MIN_Y;
  private targetX = GAME_WIDTH - 240;
  private bobTimer = 0;
  private static idCounter = 10_000;

  constructor() {
    super();

    this.body = new Graphics()
      .beginFill(0xf069aa)
      .drawPolygon([-20, -10, 24, 0, -20, 10])
      .endFill()
      .beginFill(0x22273b)
      .drawRect(-14, -4, 16, 8)
      .endFill();

    this.body.pivot.set(0, 0);
    this.addChild(this.body);
    this.visible = false;
  }

  reset(x: number, y: number, mode: SkyEnemyMode, targetX?: number): void {
    this.position.set(x, y);
    this.baseY = y;
    this.mode = mode;
    this.targetX = targetX ?? GAME_WIDTH - 280;
    this.alive = true;
    this.visible = true;
    this.health = this.maxHealth;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.id = SkyEnemy.idCounter++;
    this.body.alpha = 1;
  }

  update(deltaSeconds: number): void {
    if (!this.alive) {
      return;
    }

    this.bobTimer += deltaSeconds * (this.mode === 'patrol' ? 2.6 : 1.8);

    if (this.mode === 'patrol') {
      this.position.x -= SKY_ENEMY_SPEED * deltaSeconds;
      this.position.y = this.baseY + Math.sin(this.bobTimer) * 28;
    } else {
      if (this.position.x > this.targetX) {
        this.position.x = Math.max(this.targetX, this.position.x - SKY_ENEMY_SPEED * deltaSeconds);
      }
      this.position.y = this.baseY + Math.sin(this.bobTimer) * 10;
    }

    if (this.position.x < -72) {
      this.kill();
    }
  }

  kill(): void {
    this.alive = false;
    this.visible = false;
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) {
      return false;
    }

    this.health -= amount;
    if (this.health <= 0) {
      this.kill();
      return true;
    }

    this.body.alpha = 0.6;
    setTimeout(() => {
      this.body.alpha = 1;
    }, 80);

    return false;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 20,
      y: this.y - 12,
      width: 40,
      height: 24,
    };
  }

  getId(): number {
    return this.id;
  }
}

export class SkyEnemyManager extends Container {
  private readonly enemies: SkyEnemy[] = [];
  private spawnTimer = SKY_ENEMY_SPAWN_INTERVAL;

  update(deltaSeconds: number): void {
    this.spawnTimer -= deltaSeconds;

    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = SKY_ENEMY_SPAWN_INTERVAL * (0.8 + Math.random() * 0.6);
    }

    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(deltaSeconds);
      }
    }
  }

  forEachAlive(callback: (enemy: SkyEnemy) => void): void {
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        callback(enemy);
      }
    }
  }

  reset(): void {
    this.spawnTimer = SKY_ENEMY_SPAWN_INTERVAL;
    for (const enemy of this.enemies) {
      enemy.kill();
    }
  }

  private spawn(): void {
    const enemy = this.obtain();
    const mode: SkyEnemyMode = Math.random() < 0.5 ? 'patrol' : 'static';
    const y = randomRange(SKY_ENEMY_MIN_Y, SKY_ENEMY_MAX_Y);
    const targetX = GAME_WIDTH - randomRange(140, 280);
    enemy.reset(GAME_WIDTH + 64, y, mode, targetX);
  }

  private obtain(): SkyEnemy {
    const existing = this.enemies.find((enemy) => !enemy.isAlive() && !enemy.visible);
    if (existing) {
      existing.visible = true;
      return existing;
    }

    const created = new SkyEnemy();
    this.enemies.push(created);
    this.addChild(created);
    return created;
  }
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
