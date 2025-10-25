import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { BOSS_PROFILES, type BossProfile, FLOOR_Y, GAME_WIDTH } from './constants';
import type { EnemyShotSpawn } from './enemyProjectile';

export class Boss extends Container {
  private readonly sprite: Sprite;
  private readonly coreGlow: Sprite;
  private health = 0;
  private maxHealth = 0;
  private swingTimer = 0;
  private shotCooldown = 1.4;
  private slamTimer = 4.8;
  private orbTimer = 2.4;
  private beamTimer = 5.2;
  private enraged = false;
  private active = false;
  private readonly collisionId = 999999;
  private profile: BossProfile | null = null;

  constructor() {
    super();
    const tex = Assets.get<Texture>('boss-fortress');
    this.sprite = new Sprite(tex ?? Texture.WHITE);
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    this.coreGlow = new Sprite(Texture.WHITE);
    this.coreGlow.tint = 0xffd34d;
    this.coreGlow.alpha = 0.0;
    this.coreGlow.anchor.set(0.5);
    this.coreGlow.scale.set(0.4);
    this.addChild(this.coreGlow);
    this.visible = false;
  }

  spawn(profile: BossProfile = BOSS_PROFILES.fortress): void {
    this.profile = profile;
    const tex = Assets.get<Texture>(profile.textureAlias);
    if (tex) {
      this.sprite.texture = tex;
    }
    this.coreGlow.tint = profile.shotColor;
    this.maxHealth = profile.health;
    this.health = profile.health;
    this.swingTimer = 0;
    this.shotCooldown = 1.2;
    this.slamTimer = profile.slamInterval;
    this.orbTimer = 2.4;
    this.beamTimer = 5.2;
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
      const baseInterval = this.profile ? this.profile.slamInterval : 4.8;
      this.slamTimer = baseInterval * (this.enraged ? 0.7 : 1);
    }

    this.orbTimer -= deltaSeconds;
    if (this.orbTimer <= 0) {
      this.fireOrbVolley(fire);
      this.orbTimer = this.enraged ? 1.6 : 2.4;
    }

    this.beamTimer -= deltaSeconds;
    if (this.beamTimer <= 0) {
      this.fireIonSweep(fire);
      this.beamTimer = this.enraged ? 4 : 6.2;
    }
  }

  private fireSpread(fire: (spawn: EnemyShotSpawn) => void, playerX: number, playerY: number): void {
    const profile = this.profile ?? BOSS_PROFILES.fortress;
    const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);
    const spread = this.enraged ? 0.45 : 0.3;
    const count = this.enraged ? 5 : 3;
    for (let i = -(count - 1) / 2; i <= (count - 1) / 2; i += 1) {
      const angle = baseAngle + i * spread;
      const vx = Math.cos(angle) * profile.shotSpeed;
      const vy = Math.sin(angle) * profile.shotSpeed;
      fire({
        x: this.x - 80,
        y: this.y,
        vx,
        vy,
        lifetime: 3.8,
        damage: 2,
        radius: this.enraged ? 8 : 6,
        color: profile.shotColor,
      });
    }
  }

  private performSlam(fire: (spawn: EnemyShotSpawn) => void): void {
    const profile = this.profile ?? BOSS_PROFILES.fortress;
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
        color: profile.colorPrimary,
      });
    }
  }

  private fireOrbVolley(fire: (spawn: EnemyShotSpawn) => void): void {
    const profile = this.profile ?? BOSS_PROFILES.fortress;
    const volleys = this.enraged ? 5 : 3;
    for (let i = 0; i < volleys; i += 1) {
      const angle = -0.4 + (i / Math.max(1, volleys - 1)) * 0.8;
      const speed = 260 + i * 20;
      fire({
        x: this.x - 60,
        y: this.y - 30 + i * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifetime: 4,
        damage: 1,
        radius: 6,
        color: profile.shotColor,
      });
    }
  }

  private fireIonSweep(fire: (spawn: EnemyShotSpawn) => void): void {
    const profile = this.profile ?? BOSS_PROFILES.fortress;
    const beams = this.enraged ? 5 : 3;
    for (let i = 0; i < beams; i += 1) {
      const offset = (i / Math.max(1, beams - 1)) * 180 - 90;
      fire({
        x: this.x + offset,
        y: this.y - 70,
        vx: -180,
        vy: 0,
        lifetime: 2.5,
        damage: 3,
        radius: 10,
        color: profile.shotColor,
      });
    }
  }

  takeDamage(amount: number): boolean {
    if (!this.active) {
      return false;
    }

    this.health -= amount;
    this.coreGlow.alpha = 0.65;
    this.coreGlow.scale.set(0.6);
    setTimeout(() => {
      this.coreGlow.alpha = 0;
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
    const bounds = this.sprite.getLocalBounds();
    return {
      x: this.x - bounds.width / 2,
      y: this.y - bounds.height / 2,
      width: bounds.width,
      height: bounds.height,
    };
  }

  getCollisionId(): number {
    return this.collisionId;
  }
}
