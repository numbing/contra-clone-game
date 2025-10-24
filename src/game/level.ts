import { Container, Graphics } from 'pixi.js';
import { FLOOR_Y, GAME_HEIGHT, GAME_WIDTH } from './constants';

export class Level extends Container {
  private readonly background: Graphics;
  private readonly ground: Graphics;
  private readonly decorations: Graphics;
  private scroll = 0;

  constructor() {
    super();

    this.background = new Graphics();
    this.ground = new Graphics();
    this.decorations = new Graphics();

    this.drawBackground();
    this.drawGround();

    this.addChild(this.background, this.decorations, this.ground);
  }

  update(deltaSeconds: number): void {
    // Animate decorative stripes to fake movement.
    this.scroll = (this.scroll + deltaSeconds * 60) % 20;
    this.drawDecorations();
  }

  private drawBackground(): void {
    this.background
      .clear()
      .beginFill(0x0f1a2d)
      .drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .endFill()
      .beginFill(0x1c2945)
      .drawPolygon([
        0, FLOOR_Y - 140,
        160, FLOOR_Y - 200,
        320, FLOOR_Y - 160,
        480, FLOOR_Y - 220,
        640, FLOOR_Y - 150,
        800, FLOOR_Y - 210,
        GAME_WIDTH, FLOOR_Y - 160,
        GAME_WIDTH, FLOOR_Y,
        0, FLOOR_Y,
      ])
      .endFill();
  }

  private drawGround(): void {
    this.ground
      .clear()
      .beginFill(0x2c9466)
      .drawRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y)
      .endFill();
  }

  private drawDecorations(): void {
    this.decorations.clear();
    this.decorations.beginFill(0x1f6e4d, 0.8);

    const stripeWidth = 40;
    const stripeHeight = 8;

    for (let x = -stripeWidth; x < GAME_WIDTH + stripeWidth; x += stripeWidth * 2) {
      this.decorations.drawRect(x + this.scroll, FLOOR_Y + 18, stripeWidth, stripeHeight);
    }

    this.decorations.endFill();
  }
}
