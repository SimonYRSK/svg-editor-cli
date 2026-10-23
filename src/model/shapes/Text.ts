import { NumberText } from '../geometry/NumberText.js';
import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/**
 * `<text>`: a positioned run of characters.
 *
 * The characters are element content, not an attribute, which is why `set`
 * exposes them under the pseudo attribute name `text` (see the assignment's
 * `set <id> text "..."` examples).
 */
export class Text extends Shape {
  private xValue: number;
  private yValue: number;
  private contentValue: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.xValue = x;
    this.yValue = y;
    this.contentValue = content;
  }

  get x(): number {
    return this.xValue;
  }

  get y(): number {
    return this.yValue;
  }

  get content(): string {
    return this.contentValue;
  }

  setContent(value: string): void {
    this.contentValue = value;
  }

  override get tagName(): string {
    return 'text';
  }

  override translate(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  /** Only the anchor scales: `font-size` is not part of the geometry whitelist. */
  override scaleBy(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
  }

  override anchor(): Point {
    return new Point(this.xValue, this.yValue);
  }

  override describeGeometry(): string {
    return `${this.anchor().toString()} ${JSON.stringify(this.contentValue)}`;
  }

  override svgGeometry(): readonly NamedValue[] {
    return [
      ['x', NumberText.format(this.xValue)],
      ['y', NumberText.format(this.yValue)],
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
    if (name === 'text') {
      this.contentValue = raw;
      return true;
    }
    return false;
  }

  protected override contentText(): string {
    return this.contentValue;
  }

  protected override applyContent(content: string | null): void {
    if (content !== null) this.contentValue = content;
  }
}
