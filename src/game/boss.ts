import { Container, Graphics } from 'pixi.js';
import { BOSS_CONFIG, FLOOR_Y, GAME_WIDTH } from './constants';
import type { EnemyShotSpawn } from './enemyProjectile';

export class Boss extends Container {
  private readonly hull: Graphics;
  private readonly core: Graphics;
  private health: number = Number(BOSS_CONFIG.health);
  private readonly maxHealth: number = Number(BOSS_CONFIG.health);
  private swingTimer = 0;
  private shotCooldown = 1.4;
  private slamTimer: number = Number(BOSS_CONFIG.slamInterval);
  private enraged = false;
  private active = false;
  private readonly collisionId = 999999;

  constructor() {
    super();
    this.hull = new Graphics();
    this.core = new Graphics();
    this.addChild(this.hull, this.core);
    this.visible = false;
    this.drawBody();
  }

  private drawBody(): void {
    this.hull
      .clear()
      .beginFill(BOSS_CONFIG.colorAccent)
      .drawRect(-120, -80, 240, 160)
      .endFill()
      .beginFill(BOSS_CONFIG.colorPrimary)
      .drawPolygon([-120, -40, 120, -10, 120, 10, -120, 40])
      .endFill();

    this.core
      .clear()
      .beginFill(0xffffff, 0.9)
      .drawCircle(0, 0, 22)
      .endFill()
      .beginFill(BOSS_CONFIG.colorPrimary)
      .drawCircle(0, 0, 14)
      .endFill();
  }

  spawn(): void {
    this.health = this.maxHealth;
    this.swingTimer = 0;
    this.shotCooldown = 1.2;
    this.slamTimer = BOSS_CONFIG.slamInterval;
    this.enraged = false;
    this.active = true;
    this.visible = true;
    this.position.set(GAME_WIDTH + 180, FLOOR_Y - 140);
  }

  update(deltaSeconds: number, playerX: number, playerY: number, fire: (spawn: EnemyShotSpawn) => void): void {
    if (!this.active) {
      return;
    }

    this.swingTimer += deltaSeconds;
    this.position.x -= (this.enraged ? 75 : 55) * deltaSeconds;
    if (this.position.x < GAME_WIDTH - 240) {
      this.position.x = GAME_WIDTH - 240;
    }

    this.position.y = FLOOR_Y - 140 + Math.sin(this.swingTimer * (this.enraged ? 2.3 : 1.6)) * 28;

    this.shotCooldown -= deltaSeconds;
    if (this.shotCooldown <= 0) {
      this.fireSpread(fire, playerX, playerY);
      this.shotCooldown = this.enraged ? 0.8 : 1.3;
    }

    this.slamTimer -= deltaSeconds;
    if (this.slamTimer <= 0) {
      this.performSlam(fire);
      const baseInterval = Number(BOSS_CONFIG.slamInterval);
      this.slamTimer = baseInterval * (this.enraged ? 0.7 : 1);
    }
  }

  private fireSpread(fire: (spawn: EnemyShotSpawn) => void, playerX: number, playerY: number): void {
    const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
    const spread = this.enraged ? 0.45 : 0.3;
    const count = this.enraged ? 5 : 3;
    for (let i = -(count - 1) / 2; i <= (count - 1) / 2; i += 1) {
      const angle = baseAngle + i * spread;
      const vx = Math.cos(angle) * BOSS_CONFIG.shotSpeed;
      const vy = Math.sin(angle) * BOSS_CONFIG.shotSpeed;
      fire({
        x: this.x - 80,
        y: this.y,
        vx,
        vy,
        lifetime: 3.8,
        damage: 2,
        radius: this.enraged ? 8 : 6,
        color: BOSS_CONFIG.shotColor,
      });
    }
  }

  private performSlam(fire: (spawn: EnemyShotSpawn) => void): void {
    const columns = this.enraged ? 6 : 4;
    for (let i = 0; i < columns; i += 1) {
      const offset = (i / (columns - 1)) * 220 - 110;
      fire({
        x: this.x + offset,
        y: this.y + 30,
        vx: 0,
        vy: 260,
        lifetime: 2.5,
        damage: 2,
        radius: 7,
        color: BOSS_CONFIG.colorPrimary,
      });
    }
  }

  takeDamage(amount: number): boolean {
    if (!this.active) {
      return false;
    }

    this.health -= amount;
    this.core.scale.set(1.2);
    setTimeout(() => {
      this.core.scale.set(1);
    }, 80);

    if (!this.enraged && this.health <= this.maxHealth * 0.5) {
      this.enraged = true;
      this.shotCooldown = 0.6;
    }

    if (this.health <= 0) {
      this.active = false;
      this.visible = false;
      return true;
    }

    return false;
  }

  isActive(): boolean {
    return this.active;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - 120,
      y: this.y - 80,
      width: 240,
      height: 160,
    };
  }

  getCollisionId(): number {
    return this.collisionId;
  }
}
