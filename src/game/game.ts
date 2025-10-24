import { Application, Container, Text } from 'pixi.js';
import { BulletManager } from './bullet';
import { FLOOR_Y, GAME_HEIGHT, GAME_WIDTH, PICKUP_DROP_CHANCE } from './constants';
import { EnemyManager } from './enemy';
import { Input } from './input';
import { Level } from './level';
import { PickupManager } from './pickup';
import { Player } from './player';
import { getRandomWeapon, getWeaponLabel } from './weapons';

export class Game {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly input: Input;
  private readonly level: Level;
  private readonly bullets: BulletManager;
  private readonly enemies: EnemyManager;
  private readonly pickups: PickupManager;
  private readonly player: Player;
  private readonly hud: Text;

  private lives = 3;
  private score = 0;
  private invulnerabilityTimer = 0;

  private constructor(app: Application) {
    this.app = app;
    this.stage = app.stage;

    this.level = new Level();
    this.input = new Input(window);
    this.bullets = new BulletManager();
    this.enemies = new EnemyManager();
    this.pickups = new PickupManager();
    this.player = new Player(this.input, this.bullets);

    this.hud = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: '600',
      },
    });
    this.hud.position.set(16, 12);

    this.stage.addChild(this.level, this.enemies, this.pickups, this.player, this.bullets, this.hud);
    this.reset();

    this.app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;
      this.update(deltaSeconds);
    });
  }

  static async start(root: HTMLElement): Promise<Game> {
    const app = new Application();

    await app.init({
      background: '#0f1a2d',
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      antialias: true,
    });

    root.appendChild(app.canvas);

    return new Game(app);
  }

  private update(deltaSeconds: number): void {
    this.player.update(deltaSeconds);
    this.level.update(deltaSeconds);
    this.enemies.update(deltaSeconds);
    this.bullets.update(deltaSeconds);
    this.pickups.update(deltaSeconds);

    this.handleCollisions();
    this.input.update();
    this.updateHud();

    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaSeconds;
    }
  }

  private handleCollisions(): void {
    const playerBounds = this.player.getHitBox();

    if (this.invulnerabilityTimer <= 0) {
      let playerHit = false;
      this.enemies.forEachAlive((enemy) => {
        if (playerHit) {
          return;
        }
        const enemyBounds = enemy.getHitBox();

        if (rectsOverlap(playerBounds, enemyBounds)) {
          this.handlePlayerHit();
          playerHit = true;
        }
      });
    }

    this.bullets.forEachActive((bullet) => {
      const bulletBounds = bullet.getHitBox();
      this.enemies.forEachAlive((enemy) => {
        const enemyBounds = enemy.getHitBox();
        if (rectsOverlap(bulletBounds, enemyBounds)) {
          const registered = bullet.registerHit(enemy.getId());
          if (!registered) {
            return;
          }

          const defeated = enemy.takeDamage(bullet.getDamage());
          if (defeated) {
            this.score += 100;
            this.trySpawnPickup(enemy.x, enemy.y);
          }
        }
      });
    });

    this.pickups.forEachActive((pickup) => {
      const pickupBounds = pickup.getHitBox();
      if (rectsOverlap(playerBounds, pickupBounds)) {
        const weaponType = pickup.consume();
        this.player.collectWeapon(weaponType);
        this.score += 200;
      }
    });
  }

  private handlePlayerHit(): void {
    this.lives -= 1;
    this.player.takeHit();
    this.invulnerabilityTimer = 2.2;

    if (this.lives <= 0) {
      this.reset();
      return;
    }

    this.player.respawn(120, FLOOR_Y);
    this.bullets.clear();
    this.enemies.reset();
    this.pickups.clear();
  }

  private reset(): void {
    this.lives = 3;
    this.score = 0;
    this.invulnerabilityTimer = 1;
    this.player.respawn(120, FLOOR_Y);
    this.bullets.clear();
    this.enemies.reset();
    this.pickups.clear();
  }

  private updateHud(): void {
    const weaponLabel = getWeaponLabel(this.player.getWeaponType());
    const weaponTimer = this.player.getWeaponTimeRemaining();
    const weaponSuffix =
      weaponTimer > 0 ? ` (${Math.ceil(weaponTimer).toString().padStart(2, '0')}s)` : '';
    this.hud.text = `Score: ${this.score.toString().padStart(4, '0')}   Lives: ${this.lives}   Weapon: ${weaponLabel}${weaponSuffix}`;
  }

  private trySpawnPickup(x: number, y: number): void {
    if (Math.random() > PICKUP_DROP_CHANCE) {
      return;
    }

    const weapon = getRandomWeapon();
    this.pickups.spawn(x, y, weapon);
  }
}

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}
