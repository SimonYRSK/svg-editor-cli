import { NumberText } from '../geometry/NumberText.js';
import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/** `<line>`: a segment between two points. */
export class Line extends Shape {
  private x1Value: number;
  private y1Value: number;
  private x2Value: number;
  private y2Value: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  get x1(): number {
    return this.x1Value;
  }

  get y1(): number {
    return this.y1Value;
  }

  get x2(): number {
    return this.x2Value;
  }

  get y2(): number {
    return this.y2Value;
  }

  override get tagName(): string {
    return 'line';
  }

  override translate(dx: number, dy: number): void {
    this.x1Value += dx;
    this.y1Value += dy;
    this.x2Value += dx;
    this.y2Value += dy;
  }

  override scaleBy(factor: number): void {
    this.x1Value *= factor;
    this.y1Value *= factor;
    this.x2Value *= factor;
    this.y2Value *= factor;
  }

  override anchor(): Point {
    return new Point(this.x1Value, this.y1Value);
  }

  override describeGeometry(): string {
    const from = new Point(this.x1Value, this.y1Value).toString();
    const to = new Point(this.x2Value, this.y2Value).toString();
    return `${from} -> ${to}`;
  }

  override svgGeometry(): readonly NamedValue[] {
    return [
      ['x1', NumberText.format(this.x1Value)],
      ['y1', NumberText.format(this.y1Value)],
      ['x2', NumberText.format(this.x2Value)],
      ['y2', NumberText.format(this.y2Value)],
    ];
  }

  protected override applyGeometryAttribute(name: string, raw: string): boolean {
    if (name === 'x1') {
      this.x1Value = NumberText.parse(raw);
      return true;
    }
    if (name === 'y1') {
      this.y1Value = NumberText.parse(raw);
      return true;
    }
    if (name === 'x2') {
      this.x2Value = NumberText.parse(raw);
      return true;
    }
    if (name === 'y2') {
      this.y2Value = NumberText.parse(raw);
      return true;
    }
    return false;
  }
}
