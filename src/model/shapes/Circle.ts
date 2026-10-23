import { NumberText } from '../geometry/NumberText.js';
import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/** `<circle>`: centre and radius. */
export class Circle extends Shape {
  private cxValue: number;
  private cyValue: number;
  private radiusValue: number;

  constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    this.cxValue = cx;
    this.cyValue = cy;
    this.radiusValue = radius;
  }

  get cx(): number {
    return this.cxValue;
  }

  get cy(): number {
    return this.cyValue;
  }

  get radius(): number {
    return this.radiusValue;
  }

  override get tagName(): string {
    return 'circle';
  }

  override translate(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  override scaleBy(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.radiusValue *= factor;
  }

  override anchor(): Point {
    return new Point(this.cxValue, this.cyValue);
  }

  override svgGeometry(): readonly NamedValue[] {
    return [
      ['cx', NumberText.format(this.cxValue)],
      ['cy', NumberText.format(this.cyValue)],
      ['r', NumberText.format(this.radiusValue)],
    ];
  }

  protected override applyGeometryAttribute(name: string, raw: string): boolean {
    if (name === 'cx') {
      this.cxValue = NumberText.parse(raw);
      return true;
    }
    if (name === 'cy') {
      this.cyValue = NumberText.parse(raw);
      return true;
    }
    if (name === 'r') {
      this.radiusValue = NumberText.parseMeasure(raw);
      return true;
    }
    return false;
  }
}
