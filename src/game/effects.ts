import { AnimatedSprite, Container, Texture } from 'pixi.js';

interface ExplosionPoolItem {
  sprite: AnimatedSprite;
  alive: boolean;
}

export class ExplosionManager extends Container {
  private readonly textures: Texture[];
  private readonly pool: ExplosionPoolItem[] = [];

  constructor(textures: Texture[]) {
    super();
    this.textures = textures;
  }

  clearAll(): void {
    for (const item of this.pool) {
      item.alive = false;
      item.sprite.visible = false;
      item.sprite.stop();
    }
  }

  spawnExplosion(x: number, y: number): void {
    if (this.textures.length === 0) {
      return;
    }
    const item = this.obtain();
    const sprite = item.sprite;
    sprite.position.set(x, y);
    sprite.visible = true;
    sprite.alpha = 1;
    sprite.play();
    item.alive = true;
  }

  private obtain(): ExplosionPoolItem {
    const existing = this.pool.find((entry) => !entry.alive);
    if (existing) {
      return existing;
    }

    const sprite = new AnimatedSprite(this.textures);
    sprite.anchor.set(0.5);
    sprite.loop = false;
    sprite.animationSpeed = 0.28;
    sprite.visible = false;
    sprite.onComplete = () => {
      sprite.visible = false;
      const item = this.pool.find((entry) => entry.sprite === sprite);
      if (item) {
        item.alive = false;
      }
    };
    this.addChild(sprite);
    const item = { sprite, alive: false };
    this.pool.push(item);
    return item;
  }
}
