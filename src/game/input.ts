type KeyListener = (event: KeyboardEvent) => void;

export class Input {
  private readonly keys = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();
  private readonly downListener: KeyListener;
  private readonly upListener: KeyListener;
  private readonly target: Window;

  constructor(target: Window) {
    this.target = target;
    this.downListener = (event) => {
      const key = event.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.pressedThisFrame.add(key);
      }
      this.keys.add(key);
    };

    this.upListener = (event) => {
      const key = event.key.toLowerCase();
      this.keys.delete(key);
    };

    target.addEventListener('keydown', this.downListener);
    target.addEventListener('keyup', this.upListener);
  }

  update(): void {
    this.pressedThisFrame.clear();
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  isPressed(key: string): boolean {
    return this.pressedThisFrame.has(key.toLowerCase());
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.downListener);
    this.target.removeEventListener('keyup', this.upListener);
    this.keys.clear();
    this.pressedThisFrame.clear();
  }
}
