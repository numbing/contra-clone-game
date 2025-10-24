import { Container, Graphics } from 'pixi.js';
import { ENEMY_BASE_HEALTH, ENEMY_SPEED, ENEMY_SPAWN_INTERVAL, FLOOR_Y, GAME_WIDTH } from './constants';

export class Enemy extends Container {
  private readonly body: Graphics;
  private velocityX = -ENEMY_SPEED;
  private alive = true;
  private health = ENEMY_BASE_HEALTH;
  private maxHealth = ENEMY_BASE_HEALTH;
  private id = 0;
  private static idCounter = 1;

  constructor() {
    super();

    this.body = new Graphics()
      .beginFill(0xe14d65)
      .drawRect(-14, -24, 28, 32)
      .endFill();

    this.addChild(this.body);
  }

  reset(x: number, y: number): void {
    this.position.set(x, y);
    this.velocityX = -ENEMY_SPEED;
    this.alive = true;
    this.visible = true;
    this.health = this.maxHealth;
    this.id = Enemy.idCounter++;
    this.body.alpha = 1;
  }

  update(deltaSeconds: number): void {
    if (!this.alive) {
      return;
    }

    this.position.x += this.velocityX * deltaSeconds;
    if (this.position.x < -64) {
      this.alive = false;
      this.visible = false;
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

  getId(): number {
    return this.id;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 14,
      y: this.y - 24,
      width: 28,
      height: 32,
    };
  }
}

export class EnemyManager extends Container {
  private readonly enemies: Enemy[] = [];
  private spawnTimer = 0;

  constructor() {
    super();
  }

  update(deltaSeconds: number): void {
    this.spawnTimer -= deltaSeconds;

    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = ENEMY_SPAWN_INTERVAL;
    }

    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(deltaSeconds);
      }
    }
  }

  forEachAlive(callback: (enemy: Enemy) => void): void {
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        callback(enemy);
      }
    }
  }

  reset(): void {
    this.spawnTimer = ENEMY_SPAWN_INTERVAL;
    for (const enemy of this.enemies) {
      enemy.kill();
    }
  }

  private spawn(): void {
    const enemy = this.obtain();
    enemy.reset(GAME_WIDTH + 32, FLOOR_Y - 16);
  }

  private obtain(): Enemy {
    const enemy = this.enemies.find((entry) => !entry.isAlive() && !entry.visible);
    if (enemy) {
      enemy.visible = true;
      return enemy;
    }

    const created = new Enemy();
    this.enemies.push(created);
    this.addChild(created);
    return created;
  }
}
