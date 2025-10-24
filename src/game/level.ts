import { Container, Graphics } from 'pixi.js';
import { FLOOR_Y, GAME_HEIGHT, GAME_WIDTH, LEVEL_THEMES, type LevelThemeId } from './constants';

export class Level extends Container {
  private readonly sky: Graphics;
  private readonly horizon: Graphics;
  private readonly ground: Graphics;
  private readonly decorations: Graphics;
  private readonly scanlines: Graphics;
  private scroll = 0;
  private themeId: LevelThemeId;

  constructor(initialTheme: LevelThemeId = 'jungleDawn') {
    super();

    this.themeId = initialTheme;

    this.sky = new Graphics();
    this.horizon = new Graphics();
    this.ground = new Graphics();
    this.decorations = new Graphics();
    this.scanlines = new Graphics();

    this.addChild(this.sky, this.horizon, this.ground, this.decorations, this.scanlines);
    this.redrawTheme();
  }

  setTheme(themeId: LevelThemeId): void {
    if (this.themeId === themeId) {
      return;
    }
    this.themeId = themeId;
    this.redrawTheme();
  }

  update(deltaSeconds: number): void {
    this.scroll = (this.scroll + deltaSeconds * 70) % 40;
    this.drawDecorations();
  }

  private redrawTheme(): void {
    const theme = LEVEL_THEMES[this.themeId];

    this.sky
      .clear()
      .beginFill(theme.sky)
      .drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .endFill();

    this.horizon
      .clear()
      .beginFill(theme.horizon)
      .drawPolygon([
        0, FLOOR_Y - 160,
        180, FLOOR_Y - 220,
        360, FLOOR_Y - 190,
        540, FLOOR_Y - 260,
        720, FLOOR_Y - 200,
        900, FLOOR_Y - 250,
        GAME_WIDTH, FLOOR_Y - 210,
        GAME_WIDTH, FLOOR_Y,
        0, FLOOR_Y,
      ])
      .endFill();

    this.ground
      .clear()
      .beginFill(theme.ground)
      .drawRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y)
      .endFill()
      .beginFill(theme.accent, 0.35)
      .drawRect(0, FLOOR_Y - 10, GAME_WIDTH, 10)
      .endFill();

    this.drawDecorations();
    this.drawScanlines();
  }

  private drawDecorations(): void {
    const theme = LEVEL_THEMES[this.themeId];
    this.decorations.clear();
    this.decorations.beginFill(theme.decoration, 0.9);

    const stripeWidth = 44;
    const stripeHeight = 10;
    for (let x = -stripeWidth; x < GAME_WIDTH + stripeWidth; x += stripeWidth * 2) {
      this.decorations.drawRect(x + this.scroll, FLOOR_Y + 18, stripeWidth, stripeHeight);
    }

    this.decorations.endFill();
  }

  private drawScanlines(): void {
    this.scanlines.clear();
    this.scanlines.beginFill(0x000000, 0.05);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      this.scanlines.drawRect(0, y, GAME_WIDTH, 2);
    }
    this.scanlines.endFill();
  }
}
