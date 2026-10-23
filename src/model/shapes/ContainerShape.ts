import { Point } from '../geometry/Point.js';
import type { NamedValue } from './NamedValue.js';
import { Shape } from './Shape.js';

/**
 * A shape that owns child shapes.
 *
 * This is the Composite half of the pattern: structural commands never ask
 * "is this a group or a leaf", they ask the model for a container and let the
 * child list answer. Every geometric operation declared on `Shape` recurses
 * here, so `move` / `scale` / `delete` behave identically for a container and
 * for a leaf.
 */
export abstract class ContainerShape extends Shape {
  private readonly childNodes: Shape[] = [];

  protected constructor(id: string) {
    super(id);
  }

  get children(): readonly Shape[] {
    return this.childNodes;
  }

  get childCount(): number {
    return this.childNodes.length;
  }

  /**
   * Whether `ungroup` may lift the children out of this container.
   * Kernel groups allow it; a composite (plugin) shape refuses, because its
   * parts are an implementation detail of its provider.
   */
  get supportsUngroup(): boolean {
    return false;
  }

  /** Inserts `child` at `index` (clamped) and takes ownership of it. */
  insertChild(index: number, child: Shape): void {
    if (child === this) {
      throw new Error('a container cannot contain itself');
    }
    if (child.parent !== null) {
      throw new Error(`shape ${child.reference} already has a parent`);
    }
    const position = Math.max(0, Math.min(index, this.childNodes.length));
    this.childNodes.splice(position, 0, child);
    child.attachParent(this);
  }

  /** Appends `child` as the last (front-most) child. */
  appendChild(child: Shape): void {
    this.insertChild(this.childNodes.length, child);
  }

  indexOf(child: Shape): number {
    return this.childNodes.indexOf(child);
  }

  /** Removes `child` and returns the index it occupied. */
  removeChild(child: Shape): number {
    const index = this.childNodes.indexOf(child);
    if (index < 0) {
      throw new Error(`${child.reference} is not a child of ${this.reference}`);
    }
    this.childNodes.splice(index, 1);
    child.attachParent(null);
    return index;
  }

  /** True when `candidate` sits strictly below this container. */
  isAncestorOf(candidate: Shape): boolean {
    let node: Shape | null = candidate.parent;
    while (node !== null) {
      if (node === this) return true;
      node = node.parent;
    }
    return false;
  }

  /** This container followed by all of its descendants, in document order. */
  selfAndDescendants(): Shape[] {
    const collected: Shape[] = [this];
    for (const child of this.childNodes) {
      if (child instanceof ContainerShape) {
        collected.push(...child.selfAndDescendants());
      } else {
        collected.push(child);
      }
    }
    return collected;
  }

  /** Strict descendants, in document order. */
  descendants(): Shape[] {
    return this.selfAndDescendants().slice(1);
  }

  override translate(dx: number, dy: number): void {
    for (const child of this.childNodes) child.translate(dx, dy);
  }

  override scaleBy(factor: number): void {
    for (const child of this.childNodes) child.scaleBy(factor);
  }

  override anchor(): Point {
    return new Point(0, 0);
  }

  override svgGeometry(): readonly NamedValue[] {
    return [];
  }

  protected override applyGeometryAttribute(_name: string, _raw: string): boolean {
    return false;
  }
}
