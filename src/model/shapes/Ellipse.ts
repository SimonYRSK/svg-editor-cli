import { NumberText } from '../geometry/NumberText.js';
import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/** `<ellipse>`: centre and two radii. */
export class Ellipse extends Shape {
  private cxValue: number;
  private cyValue: number;
  private rxValue: number;
  private ryValue: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id);
    this.cxValue = cx;
    this.cyValue = cy;
    this.rxValue = rx;
    this.ryValue = ry;
  }

  get cx(): number {
    return this.cxValue;
  }

  get cy(): number {
    return this.cyValue;
  }

  get rx(): number {
    return this.rxValue;
  }

  get ry(): number {
    return this.ryValue;
  }

  override get tagName(): string {
    return 'ellipse';
  }

  override translate(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  override scaleBy(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.rxValue *= factor;
    this.ryValue *= factor;
  }

  override anchor(): Point {
    return new Point(this.cxValue, this.cyValue);
  }

  override svgGeometry(): readonly NamedValue[] {
    return [
      ['cx', NumberText.format(this.cxValue)],
      ['cy', NumberText.format(this.cyValue)],
      ['rx', NumberText.format(this.rxValue)],
      ['ry', NumberText.format(this.ryValue)],
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
    if (name === 'rx') {
      this.rxValue = NumberText.parseMeasure(raw);
      return true;
    }
    if (name === 'ry') {
      this.ryValue = NumberText.parseMeasure(raw);
      return true;
    }
    return false;
  }
}
