export default class Box {
  constructor(public x: number, public y: number, public width: number, public height: number) {}

  translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
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
