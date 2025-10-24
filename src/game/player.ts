import { Container, Graphics } from 'pixi.js';
import { FLOOR_Y, GAME_WIDTH, GRAVITY, PLAYER_JUMP, PLAYER_SPEED } from './constants';
import { BulletManager } from './bullet';
import { Input } from './input';
import type { WeaponType } from './weapons';
import { getWeaponDefinition } from './weapons';

export class Player extends Container {
  private readonly body: Graphics;
  private velocityX = 0;
  private velocityY = 0;
  private onGround = true;
  private facing = 1;
  private cooldownTimer = 0;
  private weaponTimer = 0;
  private weaponType: WeaponType = 'rifle';
  private isCrouching = false;
  private readonly input: Input;
  private readonly bullets: BulletManager;

  constructor(input: Input, bullets: BulletManager) {
    super();
    this.input = input;
    this.bullets = bullets;

    this.body = new Graphics();
    this.addChild(this.body);
    this.position.set(120, FLOOR_Y);
    this.updatePose();
  }

  update(deltaSeconds: number): void {
    this.handleMovement(deltaSeconds);
    this.handleJumping(deltaSeconds);
    this.handleShooting(deltaSeconds);
    this.updateWeaponTimer(deltaSeconds);
  }

  respawn(x: number, y: number): void {
    this.position.set(x, y);
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.weaponType = 'rifle';
    this.weaponTimer = 0;
    this.cooldownTimer = 0;
    if (this.isCrouching) {
      this.isCrouching = false;
      this.updatePose();
    }
  }

  collectWeapon(type: WeaponType): void {
    const definition = getWeaponDefinition(type);
    this.weaponType = type;
    this.weaponTimer = definition.duration ?? 0;
    this.cooldownTimer = 0;
  }

  getWeaponType(): WeaponType {
    return this.weaponType;
  }

  getWeaponTimeRemaining(): number {
    return this.weaponTimer;
  }

  getHitBox(): { x: number; y: number; width: number; height: number } {
    const height = this.isCrouching ? 32 : 48;
    const yOffset = this.isCrouching ? 32 : 48;
    return {
      x: this.x - 16,
      y: this.y - yOffset,
      width: 32,
      height,
    };
  }

  takeHit(): void {
    this.body.tint = 0xfff380;
    setTimeout(() => {
      this.body.tint = 0xffffff;
    }, 120);
  }

  private handleMovement(deltaSeconds: number): void {
    const movingLeft = this.input.isDown('arrowleft') || this.input.isDown('a');
    const movingRight = this.input.isDown('arrowright') || this.input.isDown('d');
    const crouchPressed =
      (this.input.isDown('control') ||
        this.input.isDown('arrowdown') ||
        this.input.isDown('s') ||
        this.input.isDown('shift')) &&
      this.onGround;

    if (!this.onGround && this.isCrouching) {
      this.isCrouching = false;
      this.updatePose();
    } else if (crouchPressed !== this.isCrouching) {
      this.isCrouching = crouchPressed;
      this.updatePose();
    }

    let direction = 0;
    if (!this.isCrouching) {
      if (movingLeft && !movingRight) {
        direction = -1;
      } else if (movingRight && !movingLeft) {
        direction = 1;
      }
    }

    const speed = this.isCrouching ? PLAYER_SPEED * 0.4 : PLAYER_SPEED;
    this.velocityX = direction * speed;
    this.position.x += this.velocityX * deltaSeconds;
    this.position.x = Math.max(32, Math.min(GAME_WIDTH - 32, this.position.x));

    if (direction !== 0) {
      this.facing = direction;
    }
  }

  private handleJumping(deltaSeconds: number): void {
    if (
      (this.input.isPressed(' ') || this.input.isPressed('arrowup') || this.input.isPressed('w')) &&
      this.onGround &&
      !this.isCrouching
    ) {
      this.velocityY = -PLAYER_JUMP;
      this.onGround = false;
    }

    this.velocityY += GRAVITY * deltaSeconds;
    this.position.y += this.velocityY * deltaSeconds;

    if (this.position.y >= FLOOR_Y) {
      this.position.y = FLOOR_Y;
      this.velocityY = 0;
      this.onGround = true;
    }
  }

  private handleShooting(deltaSeconds: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaSeconds;
    }

    const firing =
      this.input.isDown('j') ||
      this.input.isDown('k') ||
      this.input.isDown('z') ||
      this.input.isDown('x');

    if (!firing || this.cooldownTimer > 0) {
      return;
    }

    const definition = getWeaponDefinition(this.weaponType);
    const origin = { x: this.position.x, y: this.position.y - (this.isCrouching ? 10 : 20) };

    for (const spawn of definition.pattern(origin, this.facing)) {
      this.bullets.spawn(spawn);
    }

    this.cooldownTimer = definition.cooldown;
  }

  private updateWeaponTimer(deltaSeconds: number): void {
    if (this.weaponTimer <= 0) {
      return;
    }

    this.weaponTimer -= deltaSeconds;
    if (this.weaponTimer <= 0 && this.weaponType !== 'rifle') {
      this.weaponType = 'rifle';
      this.weaponTimer = 0;
    }
  }

  private updatePose(): void {
    this.body.clear();
    if (this.isCrouching) {
      this.body
        .beginFill(0x319bd4)
        .drawRect(-16, -32, 32, 32)
        .endFill()
        .beginFill(0x1d5d82)
        .drawRect(-16, -18, 32, 6)
        .endFill();
    } else {
      this.body
        .beginFill(0x4dd5ff)
        .drawRect(-16, -48, 32, 48)
        .endFill()
        .beginFill(0x1d5d82)
        .drawRect(-16, -24, 32, 6)
        .endFill();
    }
  }
}
