import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { FLOOR_Y, GAME_WIDTH, GRAVITY, PLAYER_JUMP, PLAYER_SPEED } from './constants';
import { BulletManager } from './bullet';
import { Input } from './input';
import { CHARACTERS, type CharacterDefinition } from './characters';
import type { WeaponType } from './weapons';
import { getWeaponDefinition } from './weapons';

export class Player extends Container {
  private readonly sprite: Sprite;
  private readonly weaponOverlay: Sprite;
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
  private character: CharacterDefinition = CHARACTERS[0];
  private readonly input: Input;
  private readonly bullets: BulletManager;
  private readonly weaponTextures: Partial<Record<WeaponType, Texture>> = {};

  constructor(input: Input, bullets: BulletManager) {
    super();
    this.input = input;
    this.bullets = bullets;

    this.sprite = new Sprite(Texture.WHITE);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(1);
    this.addChild(this.sprite);

    this.weaponOverlay = new Sprite();
    this.weaponOverlay.anchor.set(0.1, 0.5);
    this.weaponOverlay.position.set(20, -32);
    this.addChild(this.weaponOverlay);

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
    this.isCrouching = false;
    this.updateStance();
  }

  collectWeapon(type: WeaponType): void {
    const definition = getWeaponDefinition(type);
    this.weaponType = type;
    this.weaponTimer = definition.duration ?? 0;
    this.cooldownTimer = 0;
    this.updateWeaponOverlay();
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
    this.sprite.tint = 0xfff380;
    setTimeout(() => {
      this.sprite.tint = 0xffffff;
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
      this.updateStance();
    } else if (crouchPressed !== this.isCrouching) {
      this.isCrouching = crouchPressed;
      this.updateStance();
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
      this.weaponOverlay.scale.x = this.facing >= 0 ? 1 : -1;
      this.weaponOverlay.position.x = this.facing >= 0 ? 20 : -20;
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

    const baseWidth = this.sprite.width * 0.35;
    const muzzleDistance = (this.isCrouching ? 14 : 22) * this.speedMultiplier + baseWidth * 0.3;
    const baseHeight = this.isCrouching ? this.sprite.height * 0.35 : this.sprite.height * 0.45;
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
      this.updateWeaponOverlay();
    }
  }

  applyCharacter(character: CharacterDefinition): void {
    this.character = character;
    this.baseWeaponType = character.baseWeapon;
    this.weaponType = character.baseWeapon;
    this.weaponTimer = 0;
    this.speedMultiplier = character.speedMultiplier;
    this.jumpMultiplier = character.jumpMultiplier;
    this.updateSpriteTexture(character);
    this.updateStance();
    this.updateWeaponOverlay();
  }

  getCharacter(): CharacterDefinition {
    return this.character;
  }

  getBaseWeapon(): WeaponType {
    return this.baseWeaponType;
  }

  private updateSpriteTexture(character: CharacterDefinition): void {
    const texture = Assets.get<Texture>(`character-${character.id}`);
    if (texture) {
      this.sprite.texture = texture;
      this.sprite.width = texture.width;
      this.sprite.height = texture.height;
    }
  }

  private updateWeaponOverlay(): void {
    const existing = this.weaponTextures[this.weaponType];
    if (existing) {
      this.weaponOverlay.texture = existing;
    } else {
      const tex = this.getWeaponTexture(this.weaponType);
      this.weaponTextures[this.weaponType] = tex;
      this.weaponOverlay.texture = tex;
    }
    this.weaponOverlay.visible = true;
    this.weaponOverlay.scale.x = this.facing >= 0 ? 1 : -1;
    this.weaponOverlay.position.x = this.facing >= 0 ? 20 : -20;
  }

  private getWeaponTexture(type: WeaponType): Texture {
    if (!this.weaponTextures[type]) {
      const texture = Assets.get<Texture>(`weapon-${type}`);
      this.weaponTextures[type] = texture ?? Texture.WHITE;
    }
    return this.weaponTextures[type] ?? Texture.WHITE;
  }

  private updateStance(): void {
    if (this.isCrouching) {
      this.sprite.scale.y = 0.82;
      this.weaponOverlay.position.y = -20;
    } else {
      this.sprite.scale.y = 1;
      this.weaponOverlay.position.y = -32;
    }
  }
}
