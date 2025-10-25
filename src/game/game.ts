import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { BulletManager } from './bullet';
import {
  BACKGROUND_SWITCH_TIME,
  FLOOR_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  PICKUP_DROP_CHANCE,
  type LevelThemeId,
  type GroundEnemyVariantId,
  type SkyEnemyVariantId,
  BOSS_PROFILES,
  type BossProfileId,
} from './constants';
import { EnemyManager } from './enemy';
import { EnemyProjectileManager } from './enemyProjectile';
import { Input } from './input';
import { Level } from './level';
import { PickupManager } from './pickup';
import { Player } from './player';
import { getRandomWeapon, getWeaponLabel } from './weapons';
import type { WeaponType } from './weapons';
import { SkyEnemyManager } from './skyEnemy';
import { CHARACTERS, type CharacterDefinition } from './characters';
import { Boss } from './boss';
import { ExplosionManager } from './effects';

const GAME_STATE = {
  CharacterSelect: 'character-select',
  Playing: 'playing',
  BossFight: 'boss-fight',
  Victory: 'victory',
  LevelTransition: 'level-transition',
} as const;

type GameState = (typeof GAME_STATE)[keyof typeof GAME_STATE];

const BOSS_TRIGGER_TIME = 22;

const ASSET_MANIFEST = {
  bundles: [
    {
      name: 'core',
      assets: [
        { alias: 'character-atlas', src: 'assets/characters/atlas.png' },
        { alias: 'character-nova', src: 'assets/characters/nova.png' },
        { alias: 'character-k9', src: 'assets/characters/k9.png' },
        { alias: 'character-astra', src: 'assets/characters/astra.png' },
        { alias: 'enemy-scout', src: 'assets/enemies/scout.png' },
        { alias: 'enemy-gunner', src: 'assets/enemies/gunner.png' },
        { alias: 'enemy-grenadier', src: 'assets/enemies/grenadier.png' },
        { alias: 'enemy-brute', src: 'assets/enemies/brute.png' },
        { alias: 'enemy-raider', src: 'assets/enemies/raider.png' },
        { alias: 'enemy-shredder', src: 'assets/enemies/shredder.png' },
        { alias: 'enemy-pyro', src: 'assets/enemies/pyro.png' },
        { alias: 'sky-small', src: 'assets/sky/small.png' },
        { alias: 'sky-big', src: 'assets/sky/big.png' },
        { alias: 'sky-ace', src: 'assets/sky/ace.png' },
        { alias: 'sky-behemoth', src: 'assets/sky/behemoth.png' },
        { alias: 'boss-fortress', src: 'assets/boss/fortress_core.png' },
        { alias: 'boss-warlord', src: 'assets/boss/warlord_core.png' },
        { alias: 'weapon-rifle', src: 'assets/weapons/rifle.png' },
        { alias: 'weapon-rapid', src: 'assets/weapons/rapid.png' },
        { alias: 'weapon-spread', src: 'assets/weapons/spread.png' },
        { alias: 'weapon-laser', src: 'assets/weapons/laser.png' },
        { alias: 'weapon-flame', src: 'assets/weapons/flame.png' },
        { alias: 'weapon-goliath', src: 'assets/weapons/goliath.png' },
        { alias: 'weapon-aurora', src: 'assets/weapons/aurora.png' },
        { alias: 'weapon-howler', src: 'assets/weapons/howler.png' },
        { alias: 'weapon-ion', src: 'assets/weapons/ion.png' },
        { alias: 'weapon-thunder', src: 'assets/weapons/thunder.png' },
        { alias: 'weapon-vortex', src: 'assets/weapons/vortex.png' },
        { alias: 'explosion-0', src: 'assets/effects/explosion_0.png' },
        { alias: 'explosion-1', src: 'assets/effects/explosion_1.png' },
        { alias: 'explosion-2', src: 'assets/effects/explosion_2.png' },
        { alias: 'explosion-3', src: 'assets/effects/explosion_3.png' },
      ],
    },
  ],
};

interface LevelConfig {
  id: string;
  themeSequence: LevelThemeId[];
  groundVariants: GroundEnemyVariantId[];
  skyVariants: SkyEnemyVariantId[];
  dropPool: WeaponType[];
  bossProfile: BossProfileId;
}

const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'jungle',
    themeSequence: ['jungleDawn', 'jungleDusk', 'fortress'],
    groundVariants: ['scout', 'gunner', 'grenadier', 'brute'],
    skyVariants: ['small', 'big'],
    dropPool: ['spread', 'rapid', 'laser', 'flame'],
    bossProfile: 'fortress',
  },
  {
    id: 'cinder',
    themeSequence: ['cinderDawn', 'cinderStorm', 'cinderNight'],
    groundVariants: ['raider', 'shredder', 'pyro'],
    skyVariants: ['ace', 'behemoth'],
    dropPool: ['thunder', 'vortex', 'ion', 'aurora'],
    bossProfile: 'warlord',
  },
];

export class Game {
  private readonly app: Application;
  private readonly stage: Container;
  private readonly input: Input;
  private readonly level: Level;
  private readonly bullets: BulletManager;
  private readonly enemies: EnemyManager;
  private readonly skyEnemies: SkyEnemyManager;
  private readonly pickups: PickupManager;
  private readonly enemyShots: EnemyProjectileManager;
  private readonly explosions: ExplosionManager;
  private readonly player: Player;
  private readonly boss: Boss;
  private readonly hud: Text;
  private readonly overlay: Container;
  private readonly selectionContainer: Container;
  private readonly selectionCards: Graphics[] = [];
  private readonly selectionLabels: Text[] = [];
  private readonly selectionDescriptions: Text[] = [];
  private readonly victoryText: Text;
  private readonly bossHealthBar: Graphics;
  private readonly bossHealthLabel: Text;

  private state: GameState = GAME_STATE.CharacterSelect;
  private selectedCharacterIndex = 0;
  private lives = 3;
  private score = 0;
  private invulnerabilityTimer = 0;
  private stageTimer = 0;
  private backgroundPhase = 0;
  private lifeBoostsAwarded = 0;
  private currentLevelIndex = 0;
  private currentLevelConfig: LevelConfig = LEVEL_CONFIGS[0];
  private currentDropPool: WeaponType[] = [...LEVEL_CONFIGS[0].dropPool];
  private pendingLevelIndex: number | null = null;

  private constructor(app: Application) {
    this.app = app;
    this.stage = app.stage;
    this.stage.sortableChildren = true;

    this.input = new Input(window);
    this.level = new Level('jungleDawn');
    this.bullets = new BulletManager();
    this.enemies = new EnemyManager();
    this.skyEnemies = new SkyEnemyManager();
    this.pickups = new PickupManager();
    this.enemyShots = new EnemyProjectileManager();
    const explosionTextures = [
      Assets.get<Texture>('explosion-0'),
      Assets.get<Texture>('explosion-1'),
      Assets.get<Texture>('explosion-2'),
      Assets.get<Texture>('explosion-3'),
    ].filter(Boolean) as Texture[];
    this.explosions = new ExplosionManager(explosionTextures);
    this.player = new Player(this.input, this.bullets);
    this.boss = new Boss();

    this.hud = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 18,
        letterSpacing: 1.6,
      },
    });
    this.hud.position.set(18, 16);
    this.hud.zIndex = 5;

    this.overlay = new Container();
    this.overlay.zIndex = 6;

    this.selectionContainer = new Container();
    this.overlay.addChild(this.selectionContainer);
    this.buildCharacterSelect();

    this.victoryText = new Text({
      text: '',
      style: {
        fill: 0xfff0b3,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 24,
        align: 'center',
        lineHeight: 36,
      },
    });
    this.victoryText.anchor.set(0.5);
    this.victoryText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    this.victoryText.visible = false;
    this.victoryText.eventMode = 'static';
    this.victoryText.cursor = 'pointer';
    this.victoryText.on('pointertap', () => this.handleVictoryPointer());
    this.overlay.addChild(this.victoryText);

    this.bossHealthBar = new Graphics();
    this.bossHealthBar.visible = false;
    this.bossHealthBar.zIndex = 6;
    this.overlay.addChild(this.bossHealthBar);

    this.bossHealthLabel = new Text({
      text: '',
      style: {
        fill: 0xffd34d,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 16,
      },
    });
    this.bossHealthLabel.anchor.set(0.5);
    this.bossHealthLabel.position.set(GAME_WIDTH / 2, 52);
    this.bossHealthLabel.visible = false;
    this.overlay.addChild(this.bossHealthLabel);

    this.stage.addChild(
      this.level,
      this.enemies,
      this.skyEnemies,
      this.pickups,
      this.enemyShots,
      this.explosions,
      this.player,
      this.boss,
      this.bullets,
      this.hud,
      this.overlay,
    );

    this.player.visible = false;
    this.boss.visible = false;

    this.enterCharacterSelect();

    this.app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;
      this.update(deltaSeconds);
    });
  }

  static async start(root: HTMLElement): Promise<Game> {
    const app = new Application();

    await Assets.init({ manifest: ASSET_MANIFEST });
    await Assets.loadBundle('core');

    await app.init({
      background: '#060914',
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      antialias: true,
    });

    root.appendChild(app.canvas);

    return new Game(app);
  }

  private buildCharacterSelect(): void {
    const title = new Text({
      text: 'SELECT YOUR COMMANDO',
      style: {
        fill: 0xfff0b3,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 22,
        letterSpacing: 2,
      },
    });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, 90);
    this.selectionContainer.addChild(title);

    CHARACTERS.forEach((character, index) => {
      const card = new Graphics();
      card.beginFill(character.bodyColor, 0.85);
      card.drawRoundedRect(-90, -110, 180, 220, 16);
      card.endFill();
      card.beginFill(character.accentColor, 0.6);
      card.drawRoundedRect(-90, 20, 180, 80, 12);
      card.endFill();

      const label = new Text({
        text: `${index + 1}. ${character.codename}`,
        style: {
          fill: 0x0d1021,
          fontFamily: 'Press Start 2P, monospace',
          fontSize: 16,
        },
      });
      label.anchor.set(0.5);
      label.position.set(0, -60);
      card.addChild(label);

      const nameText = new Text({
        text: character.name.toUpperCase(),
        style: {
          fill: 0xffffff,
          fontFamily: 'Press Start 2P, monospace',
          fontSize: 12,
        },
      });
      nameText.anchor.set(0.5);
      nameText.position.set(0, -32);
      card.addChild(nameText);

      const desc = new Text({
        text: character.description,
        style: {
          fill: 0x0d0d12,
          fontFamily: 'Press Start 2P, monospace',
          fontSize: 10,
          wordWrap: true,
          wordWrapWidth: 150,
        },
      });
      desc.anchor.set(0.5, 0);
      desc.position.set(0, 30);
      card.addChild(desc);

      const portraitTexture = Assets.get<Texture>(`character-${character.id}`);
      if (portraitTexture) {
        const portrait = new Sprite(portraitTexture);
        portrait.anchor.set(0.5, 1);
        const scale = 90 / portraitTexture.height;
        portrait.scale.set(scale * 0.85);
        portrait.position.set(0, 16);
        card.addChild(portrait);
      }

      card.position.set(160 + index * 200, GAME_HEIGHT / 2);
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointertap', () => {
        this.selectedCharacterIndex = index;
        this.updateCharacterCardHighlight();
        this.startLevelPlay(character);
      });

      this.selectionContainer.addChild(card);
      this.selectionCards.push(card);
      this.selectionLabels.push(label);
      this.selectionDescriptions.push(desc);
    });

    this.updateCharacterCardHighlight();
  }

  private update(deltaSeconds: number): void {
    switch (this.state) {
      case GAME_STATE.CharacterSelect:
        this.updateCharacterSelect();
        this.input.update();
        return;
      case GAME_STATE.Victory:
        this.updateVictoryScreen();
        this.input.update();
        return;
      case GAME_STATE.LevelTransition:
        this.updateVictoryScreen();
        this.input.update();
        return;
      default:
        this.updateGameplay(deltaSeconds);
        this.input.update();
    }
  }

  private updateCharacterSelect(): void {
    if (this.input.isPressed('arrowleft') || this.input.isPressed('a')) {
      this.selectedCharacterIndex =
        (this.selectedCharacterIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
      this.updateCharacterCardHighlight();
    }

    if (this.input.isPressed('arrowright') || this.input.isPressed('d')) {
      this.selectedCharacterIndex =
        (this.selectedCharacterIndex + 1) % CHARACTERS.length;
      this.updateCharacterCardHighlight();
    }

    for (let i = 0; i < CHARACTERS.length; i += 1) {
      const key = (i + 1).toString();
      if (this.input.isPressed(key)) {
        this.selectedCharacterIndex = i;
        this.updateCharacterCardHighlight();
        this.startLevelPlay(CHARACTERS[i]);
        return;
      }
    }

    if (this.input.isPressed('enter') || this.input.isPressed(' ')) {
      this.startLevelPlay(CHARACTERS[this.selectedCharacterIndex]);
    }
  }

  private updateCharacterCardHighlight(): void {
    this.selectionCards.forEach((card, index) => {
      const selected = index === this.selectedCharacterIndex;
      card.alpha = selected ? 1 : 0.6;
      card.scale.set(selected ? 1.08 : 0.94);
    });
  }

  private updateGameplay(deltaSeconds: number): void {
    this.player.update(deltaSeconds);
    this.level.update(deltaSeconds);
    const bossActive = this.state === GAME_STATE.BossFight && this.boss.isActive();

    if (!bossActive) {
      this.enemies.update(
        deltaSeconds,
        this.player.x,
        this.player.y - 24,
        (spawn) => this.enemyShots.spawn(spawn),
      );
      this.skyEnemies.update(
        deltaSeconds,
        this.player.x,
        this.player.y - 30,
        (spawn) => this.enemyShots.spawn(spawn),
      );
    }
    this.bullets.update(deltaSeconds);
    this.enemyShots.update(deltaSeconds);
    this.pickups.update(deltaSeconds);

    if (this.state === GAME_STATE.BossFight && this.boss.isActive()) {
      this.boss.update(deltaSeconds, this.player.x, this.player.y - 20, (spawn) => {
        this.enemyShots.spawn(spawn);
      });
      this.updateBossHud();
    } else if (this.state === GAME_STATE.BossFight && !this.boss.isActive()) {
      this.onBossDefeated();
    }

    this.handleCollisions();
    this.updateHud();

    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaSeconds;
    }

    if (this.state === GAME_STATE.Playing) {
      this.stageTimer += deltaSeconds;
      const themeSequence = this.currentLevelConfig.themeSequence;
      if (this.backgroundPhase < themeSequence.length - 1) {
        const threshold = BACKGROUND_SWITCH_TIME * (this.backgroundPhase + 1);
        if (this.stageTimer > threshold) {
          this.backgroundPhase += 1;
          const nextTheme = themeSequence[this.backgroundPhase];
          this.level.setTheme(nextTheme as LevelThemeId);
          this.enemies.setDifficulty(Math.min(3, this.backgroundPhase + 1));
          this.skyEnemies.setDifficulty(Math.min(3, this.backgroundPhase + 1));
        }
      }

      if (this.stageTimer > BOSS_TRIGGER_TIME) {
        this.startBossFight();
      }
    }
  }

  private updateVictoryScreen(): void {
    if (this.state === GAME_STATE.LevelTransition) {
      if (this.pendingLevelIndex !== null && (this.input.isPressed('enter') || this.input.isPressed(' '))) {
        this.beginLevel(this.pendingLevelIndex, { keepStats: true });
      }
    } else if (this.state === GAME_STATE.Victory) {
      if (this.input.isPressed('enter') || this.input.isPressed(' ')) {
        this.enterCharacterSelect();
      }
    }
  }

  private startLevelPlay(character: CharacterDefinition): void {
    this.player.applyCharacter(character);
    this.beginLevel(0, { keepStats: false });
  }

  private beginLevel(levelIndex: number, options?: { keepStats?: boolean }): void {
    const keepStats = options?.keepStats ?? false;
    this.currentLevelIndex = levelIndex;
    this.currentLevelConfig = LEVEL_CONFIGS[levelIndex];
    this.currentDropPool = [...this.currentLevelConfig.dropPool];
    this.selectionContainer.visible = false;
    this.victoryText.visible = false;
    this.bossHealthBar.visible = false;
    this.bossHealthLabel.visible = false;
    this.state = GAME_STATE.Playing;
    this.stageTimer = 0;
    this.backgroundPhase = 0;
    this.lifeBoostsAwarded = 0;
    this.pendingLevelIndex = null;
    if (!keepStats) {
      this.score = 0;
      this.lives = 3;
    }
    this.invulnerabilityTimer = 1;

    const initialTheme = this.currentLevelConfig.themeSequence[0];
    this.level.setTheme(initialTheme);
    this.enemies.setVariantPool(this.currentLevelConfig.groundVariants);
    this.enemies.setActive(true);
    this.enemies.setDifficulty(1);
    this.enemies.reset();
    this.skyEnemies.setVariantPool(this.currentLevelConfig.skyVariants);
    this.skyEnemies.setDifficulty(1);
    this.skyEnemies.reset();
    this.enemyShots.clear();
    this.explosions.clearAll();
    this.pickups.clear();
    this.bullets.clear();

    this.player.respawn(120, FLOOR_Y);
    this.player.visible = true;

    this.boss.visible = false;
    this.bossHealthBar.clear();
    this.bossHealthLabel.text = '';
  }

  private startBossFight(): void {
    this.state = GAME_STATE.BossFight;
    this.backgroundPhase = 3;
    const finalTheme = this.currentLevelConfig.themeSequence.at(-1);
    if (finalTheme) {
      this.level.setTheme(finalTheme as LevelThemeId);
    }
    this.enemies.setActive(false);
    this.enemies.reset();
    this.skyEnemies.reset();
    this.enemyShots.clear();
    this.explosions.clearAll();

    const profile = BOSS_PROFILES[this.currentLevelConfig.bossProfile];
    this.boss.spawn(profile);
    this.boss.visible = true;
    this.updateBossHud();
    this.bossHealthBar.visible = true;
    this.bossHealthLabel.visible = true;

  }

  private updateBossHud(): void {
    if (!this.boss.isActive()) {
      this.bossHealthBar.visible = false;
      this.bossHealthLabel.visible = false;
      return;
    }

    const percent = Math.max(0, this.boss.getHealth() / this.boss.getMaxHealth());
    const barWidth = 520;
    const barHeight = 18;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = 40;

    this.bossHealthBar.clear();
    this.bossHealthBar.beginFill(0x1b1f33, 0.85);
    this.bossHealthBar.drawRoundedRect(x, y, barWidth, barHeight, 8);
    this.bossHealthBar.endFill();
    this.bossHealthBar.beginFill(0xff4159);
    this.bossHealthBar.drawRoundedRect(x + 2, y + 2, (barWidth - 4) * percent, barHeight - 4, 6);
    this.bossHealthBar.endFill();

    this.bossHealthLabel.visible = true;
    this.bossHealthLabel.text = `BOSS CORE ${Math.ceil(percent * 100)}%`;
  }

  private onBossDefeated(): void {
    this.score += 2000;
    this.enemyShots.clear();
    this.explosions.clearAll();
    this.explosions.spawnExplosion(this.boss.x, this.boss.y);
    this.bossHealthBar.visible = false;
    this.bossHealthLabel.visible = false;

    if (this.currentLevelIndex < LEVEL_CONFIGS.length - 1) {
      this.state = GAME_STATE.LevelTransition;
      this.pendingLevelIndex = this.currentLevelIndex + 1;
      this.victoryText.visible = true;
      this.victoryText.text = `Sector ${this.currentLevelIndex + 1} cleared!\\nTap or press Enter to deploy to Level ${this.currentLevelIndex + 2}.`;
    } else {
      this.state = GAME_STATE.Victory;
      this.victoryText.visible = true;
      this.victoryText.text = 'CONGRATULATIONS!\\nYOU KILLED THE BOSS';
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

      if (!playerHit) {
        this.skyEnemies.forEachAlive((enemy) => {
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

      if (!playerHit && this.boss.isActive()) {
        const bossBounds = this.boss.getHitBox();
        if (rectsOverlap(playerBounds, bossBounds)) {
          this.handlePlayerHit();
          playerHit = true;
        }
      }
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
            this.explosions.spawnExplosion(enemy.x, enemy.y - 12);
            this.maybeDropWeapon(enemy.x, enemy.y - 12, enemy.getDropWeapon());
            this.maybeAwardLife();
          }
        }
      });

      this.skyEnemies.forEachAlive((enemy) => {
        const enemyBounds = enemy.getHitBox();
        if (rectsOverlap(bulletBounds, enemyBounds)) {
          const registered = bullet.registerHit(enemy.getId());
          if (!registered) {
            return;
          }
          const defeated = enemy.takeDamage(bullet.getDamage());
          if (defeated) {
            this.score += 150;
            this.explosions.spawnExplosion(enemy.x, enemy.y);
            this.maybeDropWeapon(enemy.x, enemy.y, enemy.getWeaponType());
            this.maybeAwardLife();
          }
        }
      });

      if (this.boss.isActive()) {
        const bossBounds = this.boss.getHitBox();
        if (rectsOverlap(bulletBounds, bossBounds)) {
          const registered = bullet.registerHit(this.boss.getCollisionId());
          if (registered) {
            const defeated = this.boss.takeDamage(bullet.getDamage());
            if (defeated) {
              this.onBossDefeated();
            }
          }
        }
      }
    });

    this.pickups.forEachActive((pickup) => {
      const pickupBounds = pickup.getHitBox();
      if (rectsOverlap(playerBounds, pickupBounds)) {
        const weaponType = pickup.consume();
        this.player.collectWeapon(weaponType);
        this.score += 200;
      }
    });

    let shotHitPlayer = false;
    this.enemyShots.forEachActive((shot) => {
      if (shotHitPlayer) {
        return;
      }

      const shotBounds = shot.getHitBox();
      if (rectsOverlap(playerBounds, shotBounds)) {
        shot.deactivate();
        if (this.invulnerabilityTimer <= 0) {
          shotHitPlayer = true;
          this.handlePlayerHit();
        }
      }
    });
  }

  private handlePlayerHit(): void {
    this.lives -= 1;
    this.player.takeHit();
    this.invulnerabilityTimer = 2.2;

    if (this.lives <= 0) {
      this.enterCharacterSelect();
      return;
    }

    this.player.respawn(120, FLOOR_Y);
    this.enemyShots.clear();
    this.explosions.clearAll();
    this.pickups.clear();
    this.bullets.clear();
    this.enemies.reset();
    this.skyEnemies.reset();
  }

  private enterCharacterSelect(): void {
    this.state = GAME_STATE.CharacterSelect;
    this.selectionContainer.visible = true;
    this.player.visible = false;
    this.victoryText.visible = false;
    this.bossHealthBar.visible = false;
    this.bossHealthLabel.visible = false;
    this.enemies.setActive(false);
    this.enemies.reset();
    this.skyEnemies.reset();
    this.enemyShots.clear();
    this.explosions.clearAll();
    this.pickups.clear();
    this.bullets.clear();
    this.stageTimer = 0;
    this.backgroundPhase = 0;
    this.score = 0;
    this.lives = 3;
    this.lifeBoostsAwarded = 0;
    this.currentLevelIndex = 0;
    this.currentLevelConfig = LEVEL_CONFIGS[0];
    this.currentDropPool = [...LEVEL_CONFIGS[0].dropPool];
    this.level.setTheme(this.currentLevelConfig.themeSequence[0]);
    this.boss.visible = false;
    this.updateHud();
    this.updateCharacterCardHighlight();
  }

  private updateHud(): void {
    const weaponLabel = getWeaponLabel(this.player.getWeaponType());
    const weaponTimer = this.player.getWeaponTimeRemaining();
    const weaponSuffix =
      weaponTimer > 0 ? ` (${Math.ceil(weaponTimer).toString().padStart(2, '0')}s)` : '';
    const character = this.player.getCharacter();

    this.hud.text = [
      `CMND ${character.codename}`,
      `Weapon ${weaponLabel}${weaponSuffix}`,
      `Lives ${this.lives}`,
      `Score ${this.score.toString().padStart(6, '0')}`,
    ].join('    ');
  }

  private maybeDropWeapon(x: number, y: number, preferred?: WeaponType | null): void {
    if (Math.random() > PICKUP_DROP_CHANCE) {
      return;
    }
    const pool = this.currentDropPool.length ? this.currentDropPool : LEVEL_CONFIGS[0].dropPool;
    const randomWeapon = pool[Math.floor(Math.random() * pool.length)] ?? getRandomWeapon();
    const weapon = preferred ?? randomWeapon;
    this.pickups.spawn(x, y, weapon, { drop: true });
  }

  private maybeAwardLife(): void {
    if (this.lifeBoostsAwarded >= 2) {
      return;
    }
    if (Math.random() < 0.25) {
      this.lifeBoostsAwarded += 1;
      this.lives = Math.min(this.lives + 1, 9);
      this.updateHud();
    }
  }

  private handleVictoryPointer(): void {
    if (this.state === GAME_STATE.LevelTransition && this.pendingLevelIndex !== null) {
      this.beginLevel(this.pendingLevelIndex, { keepStats: true });
    } else if (this.state === GAME_STATE.Victory) {
      this.enterCharacterSelect();
    }
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
