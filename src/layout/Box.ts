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
}
