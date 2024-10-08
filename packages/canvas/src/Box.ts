// TODO this is copied from the layout package. Better way to share them?

export interface Point {
  x: number;
  y: number;
}

export class Box {
  /**
   * Create an empty box (zero width/height, located at origin).
   */
  static empty() {
    return new Box(0, 0, 0, 0);
  }

  /**
   * Compute a box that encompasses all of the given boxes.
   */
  static encompass(...boxes: Box[]) {
    if (boxes.length == 0) {
      return Box.empty();
    }
    return boxes.reduce((encompassBox, box) => encompassBox.encompass(box), Box.empty());
  }

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  /**
   * Create a copy of this box.
   */
  clone() {
    return new Box(this.x, this.y, this.width, this.height);
  }

  /**
   * Create a new box, translated by the given amounts.
   */
  translate(amount: number): Box;
  translate(dx: number, dy: number): Box;
  translate(dx: number, dy?: number): Box {
    dy ??= dx;
    return new Box(this.x + dx, this.y + dy, this.width, this.height);
  }

  /**
   * Create a new box that expands in all directions by the given amount.
   */
  expand(amount: number): Box;
  expand(amountH: number, amountV: number): Box;
  expand(amountH: number, amountV?: number) {
    amountV ??= amountH;
    return new Box(this.x - amountH, this.y - amountV, this.width + 2 * amountH, this.height + 2 * amountV);
  }

  /**
   * Create a new box that updates only the given components.
   */
  update(components: { x?: number; y?: number; width?: number; height?: number }) {
    return new Box(
      components.x ?? this.x,
      components.y ?? this.y,
      components.width ?? this.width,
      components.height ?? this.height,
    );
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

  /**
   * Returns whether or not this box contains the given point or box.
   *
   * A box or point that overlaps an edge is also contained.
   */
  contains(geom: Point | Box): boolean {
    if (geom instanceof Box) {
      return this.x <= geom.x && geom.right <= this.right && this.y <= geom.y && geom.bottom <= this.bottom;
    }

    return this.x <= geom.x && geom.x <= this.right && this.y <= geom.y && geom.y <= this.bottom;
  }

  /**
   * Returns whether or not this box overlaps the other.
   */
  overlaps(box: Box): boolean {
    return this.x <= box.right && this.right >= box.x && this.y <= box.bottom && this.bottom >= box.y;
  }

  /**
   * Does this box equal the other?
   */
  equals(box: Box): boolean {
    return this.x === box.x && this.y === box.y && this.width === box.width && this.height === box.height;
  }

  get top() {
    return this.y;
  }

  get left() {
    return this.x;
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

  toString() {
    return `Box(${this.x}, ${this.y}, ${this.width}, ${this.height})`;
  }
}
