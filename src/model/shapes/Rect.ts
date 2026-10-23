import { NumberText } from '../geometry/NumberText.js';
import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/** `<rect>`: axis aligned rectangle. */
export class Rect extends Shape {
  private xValue: number;
  private yValue: number;
  private widthValue: number;
  private heightValue: number;

  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    this.xValue = x;
    this.yValue = y;
    this.widthValue = width;
    this.heightValue = height;
  }

  get x(): number {
    return this.xValue;
  }

  get y(): number {
    return this.yValue;
  }

  get width(): number {
    return this.widthValue;
  }

  get height(): number {
    return this.heightValue;
  }

  override get tagName(): string {
    return 'rect';
  }

  override translate(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  override scaleBy(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
    this.widthValue *= factor;
    this.heightValue *= factor;
  }

  override anchor(): Point {
    return new Point(this.xValue, this.yValue);
  }

  override svgGeometry(): readonly NamedValue[] {
    return [
      ['x', NumberText.format(this.xValue)],
      ['y', NumberText.format(this.yValue)],
      ['width', NumberText.format(this.widthValue)],
      ['height', NumberText.format(this.heightValue)],
    ];
  }

  protected override applyGeometryAttribute(name: string, raw: string): boolean {
    if (name === 'x') {
      this.xValue = NumberText.parse(raw);
      return true;
    }
    if (name === 'y') {
      this.yValue = NumberText.parse(raw);
      return true;
    }
    if (name === 'width') {
      this.widthValue = NumberText.parseMeasure(raw);
      return true;
    }
    if (name === 'height') {
      this.heightValue = NumberText.parseMeasure(raw);
      return true;
    }
    return false;
  }
}
