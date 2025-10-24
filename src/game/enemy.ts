import { Assets, Container, Sprite, Texture } from 'pixi.js';
import {
  FLOOR_Y,
  GAME_WIDTH,
  GROUND_ENEMY_SPAWN_INTERVAL,
  GROUND_ENEMY_VARIANTS,
  type GroundEnemyVariantId,
} from './constants';
import type { EnemyShotSpawn } from './enemyProjectile';
import type { WeaponType } from './weapons';

export class Enemy extends Container {
  private readonly sprite: Sprite;
  private variantId: GroundEnemyVariantId = 'scout';
  private alive = false;
  private health = 1;
  private fireCooldown = 0;
  private dashTimer = 0;
  private dashDir = 1;
  private id = 0;
  private static idCounter = 1;
  private dropWeapon: WeaponType | null = 'rifle';

  constructor() {
    super();
    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.anchor.set(0.5, 1);
    this.addChild(this.sprite);
  }

  private get data() {
    return GROUND_ENEMY_VARIANTS[this.variantId];
  }

  reset(x: number, y: number, variant: GroundEnemyVariantId): void {
    this.variantId = variant;
    const data = this.data;

    this.position.set(x, y);
    this.alive = true;
    this.visible = true;
    this.health = data.health;
    this.sprite.alpha = 1;
    this.fireCooldown = data.fireInterval > 0 ? data.fireInterval * (0.5 + Math.random()) : 0;
    this.dashTimer = 1.2 + Math.random() * 1.4;
    this.dashDir = Math.random() < 0.5 ? 1 : -1;
    this.id = Enemy.idCounter++;
    this.dropWeapon = data.dropWeapon ?? null;

    const tex = Assets.get<Texture>(`enemy-${variant}`);
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
    this.position.x -= data.speed * deltaSeconds;

    // Dashing scouts zig-zag slightly to feel lively.
    if (data.ability === 'dash') {
      this.dashTimer -= deltaSeconds;
      if (this.dashTimer <= 0) {
        this.dashTimer = 0.6 + Math.random();
        this.dashDir *= -1;
      }
      this.position.y = FLOOR_Y - 16 + Math.sin(this.dashTimer * 6) * 6 * this.dashDir;
    } else {
      this.position.y = FLOOR_Y - 16;
    }

    if (this.position.x < -96) {
      this.kill();
      return;
    }

    // Offensive abilities.
    if (data.ability === 'shoot' || data.ability === 'lob') {
      this.fireCooldown -= deltaSeconds;
      if (this.fireCooldown <= 0) {
        const targetX = playerX;
        const targetY = playerY;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        let vx = -data.bulletSpeed;
        let vy = 0;

        if (data.ability === 'shoot' && Math.abs(dy) < 100) {
          const distance = Math.hypot(dx, dy);
          if (distance > 32) {
            vx = (dx / distance) * data.bulletSpeed;
            vy = (dy / distance) * data.bulletSpeed;
          }
        } else if (data.ability === 'lob') {
          vx = -data.bulletSpeed;
          vy = -data.bulletSpeed * 0.6;
        }

        fire({
          x: this.x - 14,
          y: this.y - 18,
          vx,
          vy,
          lifetime: 2.8,
          damage: 1,
          radius: data.ability === 'lob' ? 6 : 4,
          color: data.stripe,
          gravity: data.ability === 'lob' ? 480 : 0,
        });

        this.fireCooldown = data.fireInterval * (0.7 + Math.random() * 0.6);
      }
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

    const data = this.data;
    const finalAmount = data.ability === 'shield' ? Math.max(1, amount - 1) : amount;
    this.health -= finalAmount;
    if (this.health <= 0) {
      this.kill();
      return true;
    }

    this.sprite.alpha = 0.5;
    setTimeout(() => {
      this.sprite.alpha = 1;
    }, 70);

    return false;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getId(): number {
    return this.id;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    const bounds = this.sprite.getLocalBounds();
    return {
      x: this.x - bounds.width / 2,
      y: this.y - bounds.height,
      width: bounds.width,
      height: bounds.height,
    };
  }

  getDropWeapon(): WeaponType | null {
    return this.dropWeapon;
  }
}

const DIFFICULTY_TABLE: Record<number, GroundEnemyVariantId[]> = {
  1: ['scout', 'gunner'],
  2: ['scout', 'gunner', 'grenadier'],
  3: ['gunner', 'grenadier', 'brute'],
};

export class EnemyManager extends Container {
  private readonly enemies: Enemy[] = [];
  private spawnTimer = 0;
  private active = true;
  private difficultyTier = 1;

  constructor() {
    super();
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  setDifficulty(tier: number): void {
    this.difficultyTier = Math.min(3, Math.max(1, Math.round(tier)));
  }

  update(
    deltaSeconds: number,
    playerX: number,
    playerY: number,
    fire: (spawn: EnemyShotSpawn) => void,
  ): void {
    if (this.active) {
      this.spawnTimer -= deltaSeconds;

      if (this.spawnTimer <= 0) {
        this.spawn();
        this.spawnTimer = GROUND_ENEMY_SPAWN_INTERVAL * (0.7 + Math.random() * 0.6);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(deltaSeconds, playerX, playerY, fire);
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
    this.spawnTimer = 0.6;
    for (const enemy of this.enemies) {
      enemy.kill();
    }
  }

  private spawn(): void {
    const pool = DIFFICULTY_TABLE[this.difficultyTier] ?? DIFFICULTY_TABLE[1];
    const variant = pool[Math.floor(Math.random() * pool.length)];
    const enemy = this.obtain();
    enemy.reset(GAME_WIDTH + 32, FLOOR_Y - 16, variant);
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
