import { Container, Graphics } from 'pixi.js';
import { FLOOR_Y, GAME_WIDTH, GRAVITY, PLAYER_JUMP, PLAYER_SPEED } from './constants';
import { BulletManager } from './bullet';
import { Input } from './input';
import { CHARACTERS, type CharacterDefinition } from './characters';
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
  private baseWeaponType: WeaponType = 'rifle';
  private speedMultiplier = 1;
  private jumpMultiplier = 1;
  private bodyColor = 0x4dd5ff;
  private accentColor = 0x1d5d82;
  private character: CharacterDefinition = CHARACTERS[0];
  private readonly input: Input;
  private readonly bullets: BulletManager;

  constructor(input: Input, bullets: BulletManager) {
    super();
    this.input = input;
    this.bullets = bullets;

    this.body = new Graphics();
    this.addChild(this.body);
    this.position.set(120, FLOOR_Y);
    this.applyCharacter(CHARACTERS[0]);
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
    this.weaponType = this.baseWeaponType;
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

    const baseSpeed = PLAYER_SPEED * this.speedMultiplier;
    const speed = this.isCrouching ? baseSpeed * 0.4 : baseSpeed;
    this.velocityX = direction * speed;
    this.position.x += this.velocityX * deltaSeconds;
    this.position.x = Math.max(32, Math.min(GAME_WIDTH - 32, this.position.x));

    if (direction !== 0) {
      this.facing = direction;
    }
  }

  private handleJumping(deltaSeconds: number): void {
    if (this.input.isPressed(' ') && this.onGround && !this.isCrouching) {
      this.velocityY = -PLAYER_JUMP * this.jumpMultiplier;
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
    const aimingUp = (this.input.isDown('arrowup') || this.input.isDown('w')) && !this.isCrouching;
    const aimingDown =
      (this.input.isDown('arrowdown') || this.input.isDown('s')) && !aimingUp && !this.isCrouching;
    const aimingLeft = this.input.isDown('arrowleft') || this.input.isDown('a');
    const aimingRight = this.input.isDown('arrowright') || this.input.isDown('d');

    let aimX = this.facing;
    let aimY = 0;

    if (aimingUp) {
      aimY = -1;
      if (aimingLeft !== aimingRight) {
        aimX = aimingLeft ? -1 : 1;
      } else if (Math.abs(this.velocityX) < 1) {
        aimX = 0;
      }
    } else if (aimingDown && !this.onGround) {
      aimY = 1;
      if (aimingLeft !== aimingRight) {
        aimX = aimingLeft ? -1 : 1;
      } else {
        aimX = 0;
      }
    } else {
      aimY = 0;
      aimX = this.facing;
    }

    if (aimX === 0 && aimY === 0) {
      aimX = this.facing !== 0 ? this.facing : 1;
    }

    const magnitude = Math.hypot(aimX, aimY);
    const normX = magnitude === 0 ? 1 : aimX / magnitude;
    const normY = magnitude === 0 ? 0 : aimY / magnitude;
    const direction = normX >= 0 ? 1 : -1;
    const angle = Math.asin(-normY);

    const muzzleDistance = (this.isCrouching ? 16 : 24) * this.speedMultiplier;
    const baseHeight = this.isCrouching ? 16 : 24;
    const origin = {
      x: this.position.x + direction * Math.cos(angle) * muzzleDistance,
      y: this.position.y - baseHeight - Math.sin(angle) * muzzleDistance,
    };

    for (const spawn of definition.pattern(origin, direction, angle)) {
      this.bullets.spawn(spawn);
    }

    this.cooldownTimer = definition.cooldown;
  }

  private updateWeaponTimer(deltaSeconds: number): void {
    if (this.weaponTimer <= 0) {
      return;
    }

    this.weaponTimer -= deltaSeconds;
    if (this.weaponTimer <= 0 && this.weaponType !== this.baseWeaponType) {
      this.weaponType = this.baseWeaponType;
      this.weaponTimer = 0;
    }
  }

  private updatePose(): void {
    this.body.clear();
    if (this.isCrouching) {
      this.body
        .beginFill(this.bodyColor)
        .drawRect(-16, -32, 32, 32)
        .endFill()
        .beginFill(this.accentColor)
        .drawRect(-16, -18, 32, 6)
        .endFill();
    } else {
      this.body
        .beginFill(this.bodyColor)
        .drawRect(-16, -48, 32, 48)
        .endFill()
        .beginFill(this.accentColor)
        .drawRect(-16, -24, 32, 6)
        .endFill();
    }
  }

  applyCharacter(character: CharacterDefinition): void {
    this.character = character;
    this.bodyColor = character.bodyColor;
    this.accentColor = character.accentColor;
    this.baseWeaponType = character.baseWeapon;
    this.weaponType = character.baseWeapon;
    this.weaponTimer = 0;
    this.speedMultiplier = character.speedMultiplier;
    this.jumpMultiplier = character.jumpMultiplier;
    this.updatePose();
  }

  getCharacter(): CharacterDefinition {
    return this.character;
  }

  getBaseWeapon(): WeaponType {
    return this.baseWeaponType;
  }
}
