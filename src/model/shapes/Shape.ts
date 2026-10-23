import { InvalidMeasureError } from '../errors/InvalidMeasureError.js';
import { UnknownAttributeError } from '../errors/UnknownAttributeError.js';
import { NumberText } from '../geometry/NumberText.js';
import type { Point } from '../geometry/Point.js';
import type { ContainerShape } from './ContainerShape.js';
import type { NamedValue } from './NamedValue.js';
import type { ShapeState } from './ShapeState.js';

/**
 * Root of the shape hierarchy (the whole model is one Composite tree).
 *
 * Design notes:
 * - geometry and style are private; subclasses expose them through the
 *   polymorphic methods below, so no caller ever needs to know which concrete
 *   shape it holds (`switch (tag)` never appears in the code);
 * - `translate` / `scaleBy` / `captureState` / `restoreState` are the four
 *   operations every command is built from, and they are declared here so a
 *   leaf shape and a container are manipulated uniformly;
 * - attributes that the kernel does not understand (for example `transform` or
 *   `font-size` coming from a foreign SVG file) are preserved verbatim so a
 *   `read` / `save` round trip is lossless.
 */
export abstract class Shape {
  private static readonly FILL = 'fill';
  private static readonly STROKE = 'stroke';
  private static readonly STROKE_WIDTH = 'stroke-width';

  private readonly shapeId: string;
  private fillValue: string | null = null;
  private strokeValue: string | null = null;
  private strokeWidthValue: number | null = null;
  private readonly preservedAttributes: NamedValue[] = [];
  private parentContainer: ContainerShape | null = null;

  protected constructor(id: string) {
    this.shapeId = id;
  }

  // ---------------------------------------------------------------- identity

  get id(): string {
    return this.shapeId;
  }

  /** SVG element name (`rect`, `circle`, `g`, ...). */
  abstract get tagName(): string;

  /** Registered type name; equal to `tagName` for kernel shapes, plugins may differ. */
  get typeName(): string {
    return this.tagName;
  }

  /** `rect#r1` — how a shape names itself in command output. */
  get reference(): string {
    return `${this.tagName}#${this.shapeId}`;
  }

  get parent(): ContainerShape | null {
    return this.parentContainer;
  }

  /** Model-internal: only a `ContainerShape` changes the parent link. */
  attachParent(container: ContainerShape | null): void {
    this.parentContainer = container;
  }

  // ---------------------------------------------------------------- geometry

  /** Moves the shape by a delta (incremental, composite-aware). */
  abstract translate(dx: number, dy: number): void;

  /** Multiplies every geometric attribute of the shape by `factor`. */
  abstract scaleBy(factor: number): void;

  /** Anchor point reported by `move` for a leaf shape. */
  abstract anchor(): Point;

  /** The shape's own geometry as SVG attributes, in serialization order. */
  abstract svgGeometry(): readonly NamedValue[];

  /**
   * Applies one of the shape's own geometry attributes from its raw text form.
   * @returns false when this type does not own that attribute.
   */
  protected abstract applyGeometryAttribute(name: string, raw: string): boolean;

  // ------------------------------------------------------------------- style

  get fill(): string | null {
    return this.fillValue;
  }

  get stroke(): string | null {
    return this.strokeValue;
  }

  get strokeWidth(): number | null {
    return this.strokeWidthValue;
  }

  setFill(value: string): void {
    this.fillValue = value;
  }

  setStroke(value: string): void {
    this.strokeValue = value;
  }

  setStrokeWidth(raw: string): void {
    const width = NumberText.parse(raw);
    if (width < 0) throw new InvalidMeasureError(raw);
    this.strokeWidthValue = width;
  }

  /** Set attributes shared by every shape, in display order. */
  stylePairs(): readonly NamedValue[] {
    const pairs: NamedValue[] = [];
    if (this.fillValue !== null) pairs.push([Shape.FILL, this.fillValue]);
    if (this.strokeValue !== null) pairs.push([Shape.STROKE, this.strokeValue]);
    if (this.strokeWidthValue !== null) {
      pairs.push([Shape.STROKE_WIDTH, NumberText.format(this.strokeWidthValue)]);
    }
    return pairs;
  }

  // -------------------------------------------------------------- attributes

  /**
   * Validates and applies a single attribute for `set`.
   *
   * The whole whitelist of a type lives in this method plus the subclass hook,
   * which keeps "what may be set" next to "how it is stored".
   *
   * @returns the applied pair, already normalised for the transcript.
   */
  setAttribute(name: string, raw: string): NamedValue {
    if (name === Shape.FILL) {
      this.fillValue = raw;
      return [name, raw];
    }
    if (name === Shape.STROKE) {
      this.strokeValue = raw;
      return [name, raw];
    }
    if (name === Shape.STROKE_WIDTH) {
      this.setStrokeWidth(raw);
      return [name, NumberText.format(this.strokeWidthValue as number)];
    }
    if (this.applyGeometryAttribute(name, raw)) {
      const applied = this.svgGeometry().find(([attribute]) => attribute === name);
      return applied ?? [name, raw];
    }
    throw new UnknownAttributeError(name);
  }

  /** Geometry as shown by `tree` / `show` (`width` collapses to `w`). */
  displayGeometry(): readonly NamedValue[] {
    return this.svgGeometry().map(([name, value]) => [Shape.displayName(name), value] as NamedValue);
  }

  /** How this type renders its geometry in one line; overridden by `text` and `line`. */
  describeGeometry(): string {
    return this.displayGeometry()
      .map(([name, value]) => `${name}=${value}`)
      .join(' ');
  }

  /** Every attribute shown for this shape (`tree` and `show` share this order). */
  displayAttributes(): readonly NamedValue[] {
    const geometry = this.displayGeometry();
    if (geometry.length === 0) return this.stylePairs();
    return [...geometry, ...this.stylePairs()];
  }

  /** Attributes written to an SVG file, in a stable order. */
  toXmlAttributes(): readonly NamedValue[] {
    return [['id', this.shapeId] as NamedValue, ...this.svgGeometry(), ...this.stylePairs(), ...this.preservedAttributes];
  }

  /** Attributes the kernel does not understand, preserved verbatim. */
  get preserved(): readonly NamedValue[] {
    return this.preservedAttributes;
  }

  preserveAttribute(name: string, value: string): void {
    this.preservedAttributes.push([name, value]);
  }

  /**
   * Loads the optional attributes of an element read from a file.
   * Geometry is already applied by the provider, `fill` / `stroke` /
   * `stroke-width` are applied here, everything else is preserved verbatim.
   */
  loadAttributes(attributes: ReadonlyMap<string, string>): void {
    const geometryNames = new Set(this.svgGeometry().map(([name]) => name));
    for (const [name, raw] of attributes) {
      if (name === 'id' || geometryNames.has(name)) continue;
      if (name === Shape.FILL) {
        this.fillValue = raw;
        continue;
      }
      if (name === Shape.STROKE) {
        this.strokeValue = raw;
        continue;
      }
      if (name === Shape.STROKE_WIDTH) {
        const width = NumberText.readLenient(raw);
        if (width !== null && width >= 0) this.strokeWidthValue = width;
        continue;
      }
      this.preserveAttribute(name, raw);
    }
  }

  /** Text drawn by the element (`<text>` only); `null` for every other shape. */
  get textContent(): string | null {
    return this.contentText();
  }

  // ---------------------------------------------------------------- memento

  captureState(): ShapeState {
    return {
      geometry: this.svgGeometry(),
      fill: this.fillValue,
      stroke: this.strokeValue,
      strokeWidth: this.strokeWidthValue,
      content: this.contentText(),
    };
  }

  restoreState(state: ShapeState): void {
    for (const [name, raw] of state.geometry) {
      this.applyGeometryAttribute(name, raw);
    }
    this.fillValue = state.fill;
    this.strokeValue = state.stroke;
    this.strokeWidthValue = state.strokeWidth;
    this.applyContent(state.content);
  }

  // ------------------------------------------------------- subclass hooks

  /** Rendered text of the element, if it has any. */
  protected contentText(): string | null {
    return null;
  }

  /** Restores rendered text; ignored by shapes without text. */
  protected applyContent(_content: string | null): void {
    // no-op for shapes that carry no text
  }

  private static displayName(name: string): string {
    if (name === 'width') return 'w';
    if (name === 'height') return 'h';
    return name;
  }
}
