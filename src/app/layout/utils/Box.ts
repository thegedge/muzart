export class Box {
  /**
   * Create an empty box (zero width/height, located at origin).
   */
  static empty() {
    return new Box(0, 0, 0, 0);
  }

  constructor(public x: number, public y: number, public width: number, public height: number) {}

  /**
   * Create a copy of this box.
   */
  clone() {
    return new Box(this.x, this.y, this.width, this.height);
  }

  /**
   * Create a new box, translated by the given amounts.
   */
  translate(dx: number, dy: number) {
    return new Box(this.x + dx, this.y + dy, this.width, this.height);
  }

  /**
   * Create a new box, inverting the translation of this box.
   */
  inverse() {
    return new Box(-this.x, -this.y, this.width, this.height);
  }

  /**
   * Create a new box that expands in all directions by the given amount.
   */
  expand(amount: number) {
    return new Box(this.x - amount, this.y - amount, this.width + 2 * amount, this.height + 2 * amount);
  }

  /**
   * Create a new box that includes both this box and the given box.
   */
  encompass(box: Box) {
    const x = Math.min(this.x, box.x);
    const y = Math.min(this.y, box.y);
    const r = Math.max(this.right, box.right);
    const b = Math.max(this.bottom, box.bottom);
    return new Box(x, y, r - x, b - y);
  }

  get right() {
    return this.x + this.width;
  }

  get bottom() {
    return this.y + this.height;
  }

  get centerX() {
    return this.x + 0.5 * this.width;
  }

  get centerY() {
    return this.y + 0.5 * this.height;
  }
}
