import { Assets, Container, Sprite, Texture } from 'pixi.js';
import {
  GAME_WIDTH,
  SKY_ENEMY_MAX_Y,
  SKY_ENEMY_MIN_Y,
  SKY_ENEMY_SPAWN_INTERVAL,
  SKY_ENEMY_VARIANTS,
  type SkyEnemyVariantId,
} from './constants';
import type { WeaponType } from './weapons';
import type { EnemyShotSpawn } from './enemyProjectile';

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class SkyEnemy extends Container {
  private readonly sprite: Sprite;
  private variant: SkyEnemyVariantId = 'small';
  private alive = false;
  private health = 1;
  private baseY = SKY_ENEMY_MIN_Y;
  private bobTimer = 0;
  private fireCooldown = 0;
  private id = 0;
  private static idCounter = 10_000;
  private weaponType: WeaponType = 'rapid';

  constructor() {
    super();
    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.anchor.set(0.5, 0.5);
    this.addChild(this.sprite);
    this.visible = false;
  }

  private get data() {
    return SKY_ENEMY_VARIANTS[this.variant];
  }

  reset(x: number, y: number, variant: SkyEnemyVariantId): void {
    this.variant = variant;
    const data = this.data;

    this.position.set(x, y);
    this.baseY = y;
    this.health = data.health;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.fireCooldown = randomRange(data.fireIntervalMin, data.fireIntervalMax);
    this.id = SkyEnemy.idCounter++;
    this.alive = true;
    this.visible = true;
    this.weaponType = data.weapon;

    this.sprite.alpha = 1;
    const tex = Assets.get<Texture>(`sky-${variant}`);
    if (tex) {
      this.sprite.texture = tex;
      this.sprite.width = tex.width;
      this.sprite.height = tex.height;
    }
  }

  update(
    deltaSeconds: number,
    playerX: number,
    playerY: number,
    fire: (spawn: EnemyShotSpawn) => void,
  ): void {
    if (!this.alive) {
      return;
    }

    const data = this.data;

    this.bobTimer += deltaSeconds * 2.4;
    this.position.x -= data.speed * deltaSeconds;
    this.position.y = this.baseY + Math.sin(this.bobTimer) * data.bobAmplitude;

    if (this.position.x < -80) {
      this.kill();
      return;
    }

    this.fireCooldown -= deltaSeconds;
    if (this.fireCooldown <= 0 && this.position.x < GAME_WIDTH + 32) {
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 28 && Math.random() < 0.75) {
        const speed = data.shotSpeed;
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;

        fire({
          x: this.x - Math.sign(vx) * 12,
          y: this.y,
          vx,
          vy,
          lifetime: 3,
          damage: 1,
          radius: data.shotRadius,
          color: data.shotColor,
        });
      }

      this.fireCooldown = randomRange(data.fireIntervalMin, data.fireIntervalMax);
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

    this.sprite.alpha = 0.6;
    setTimeout(() => {
      this.sprite.alpha = 1;
    }, 80);

    return false;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getId(): number {
    return this.id;
  }

  getWeaponType(): WeaponType {
    return this.weaponType;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    const bounds = this.sprite.getLocalBounds();
    return {
      x: this.x - bounds.width / 2,
      y: this.y - bounds.height / 2,
      width: bounds.width,
      height: bounds.height,
    };
  }
}

const SKY_VARIANT_TABLE: Record<number, SkyEnemyVariantId[]> = {
  1: ['small', 'small', 'big'],
  2: ['small', 'big', 'big'],
  3: ['big', 'big', 'big'],
};

export class SkyEnemyManager extends Container {
  private readonly enemies: SkyEnemy[] = [];
  private spawnTimer = SKY_ENEMY_SPAWN_INTERVAL;
  private difficultyTier = 1;
  private customPool: SkyEnemyVariantId[] | null = null;

  update(
    deltaSeconds: number,
    playerX: number,
    playerY: number,
    fire: (spawn: EnemyShotSpawn) => void,
  ): void {
    this.spawnTimer -= deltaSeconds;

    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = SKY_ENEMY_SPAWN_INTERVAL * (0.7 + Math.random() * 0.8);
    }

    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(deltaSeconds, playerX, playerY, fire);
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

  setDifficulty(tier: number): void {
    this.difficultyTier = Math.min(3, Math.max(1, Math.round(tier)));
  }

  setVariantPool(pool: SkyEnemyVariantId[]): void {
    this.customPool = pool.length ? [...pool] : null;
  }

  reset(): void {
    this.spawnTimer = SKY_ENEMY_SPAWN_INTERVAL;
    for (const enemy of this.enemies) {
      enemy.kill();
    }
  }

  private spawn(): void {
    const enemy = this.obtain();
    const variant = this.pickVariant();
    const y = randomRange(SKY_ENEMY_MIN_Y, SKY_ENEMY_MAX_Y);
    enemy.reset(GAME_WIDTH + 64, y, variant);
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

  private pickVariant(): SkyEnemyVariantId {
    const pool = this.customPool && this.customPool.length > 0
      ? this.customPool
      : SKY_VARIANT_TABLE[this.difficultyTier] ?? SKY_VARIANT_TABLE[1];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
