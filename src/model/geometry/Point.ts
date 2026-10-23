import { NumberText } from './NumberText.js';

/** An immutable position on the canvas (SVG coordinate system: origin top-left, y down). */
export class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  translated(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  scaled(factor: number): Point {
    return new Point(this.x * factor, this.y * factor);
  }

  /** `(x,y)`: the notation used inside `tree` and `show` output. */
  toString(): string {
    return `(${NumberText.format(this.x)},${NumberText.format(this.y)})`;
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
