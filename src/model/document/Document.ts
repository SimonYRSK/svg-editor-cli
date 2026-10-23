import { DuplicateIdError } from '../errors/DuplicateIdError.js';
import { InvalidMeasureError } from '../errors/InvalidMeasureError.js';
import { MissingContainerError } from '../errors/MissingContainerError.js';
import { MissingShapeError } from '../errors/MissingShapeError.js';
import { NotAContainerError } from '../errors/NotAContainerError.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import { RootNode } from '../shapes/RootNode.js';
import type { Shape } from '../shapes/Shape.js';
import type { Placement } from './Placement.js';

/**
 * The open drawing: a canvas size, the `<svg>` root, and the shape tree.
 *
 * The document is the only owner of the tree.  Everything a command needs to
 * do is offered here (look a shape up by id, detach it together with its
 * position, insert it back), so no command manipulates child lists by hand and
 * id uniqueness is enforced in exactly one place.
 */
export class Document {
  private readonly rootNode: RootNode;
  private canvasWidth: number;
  private canvasHeight: number;
  private filePath: string | null = null;

  constructor(width = 800, height = 600) {
    this.rootNode = new RootNode();
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  get root(): RootNode {
    return this.rootNode;
  }

  get width(): number {
    return this.canvasWidth;
  }

  get height(): number {
    return this.canvasHeight;
  }

  /** Resizes the canvas; the shapes keep their coordinates. */
  resize(width: number, height: number): void {
    if (width <= 0) throw new InvalidMeasureError(String(width));
    if (height <= 0) throw new InvalidMeasureError(String(height));
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /** Path the document was read from / last saved to. */
  get sourcePath(): string | null {
    return this.filePath;
  }

  setSourcePath(path: string): void {
    this.filePath = path;
  }

  // ------------------------------------------------------------- lookups

  find(id: string): Shape | null {
    if (id.length === 0) return null;
    return this.search(this.rootNode, id);
  }

  /** @throws MissingShapeError */
  require(id: string): Shape {
    const shape = this.find(id);
    if (shape === null) throw new MissingShapeError(id);
    return shape;
  }

  findContainer(id: string): ContainerShape | null {
    const shape = this.find(id);
    return shape instanceof ContainerShape ? shape : null;
  }

  /**
   * Resolves the target of a `create ... in <id>` clause.
   * @throws MissingContainerError when there is no such shape
   * @throws NotAContainerError when the shape is a leaf
   */
  requireContainer(id: string): ContainerShape {
    const shape = this.find(id);
    if (shape === null) throw new MissingContainerError(id);
    if (!(shape instanceof ContainerShape)) throw new NotAContainerError(id);
    return shape;
  }

  /** Every shape of the document, in document order (root excluded). */
  allShapes(): Shape[] {
    return this.rootNode.selfAndDescendants().slice(1);
  }

  countShapes(): number {
    return this.allShapes().length;
  }

  // ------------------------------------------------------------ structure

  /** @throws DuplicateIdError when the id is taken. */
  assertIdAvailable(id: string): void {
    if (this.find(id) !== null) throw new DuplicateIdError(id);
  }

  /** Inserts a detached shape at `index` (appended when omitted). */
  insert(shape: Shape, parent: ContainerShape, index?: number): void {
    this.assertIdAvailable(shape.id);
    parent.insertChild(index ?? parent.childCount, shape);
  }

  /** Detaches a shape (with its whole subtree) and reports where it was. */
  remove(shape: Shape): Placement {
    const placement = this.placementOf(shape);
    placement.parent.removeChild(shape);
    return placement;
  }

  /** @throws Error when the shape is not part of this document. */
  placementOf(shape: Shape): Placement {
    const parent = shape.parent;
    if (parent === null) {
      throw new Error(`${shape.reference} is not attached to a document`);
    }
    const index = parent.indexOf(shape);
    if (index < 0) {
      throw new Error(`${shape.reference} is not a child of ${parent.reference}`);
    }
    return { parent, index };
  }

  isTopLevel(shape: Shape): boolean {
    return shape.parent === this.rootNode;
  }

  // -------------------------------------------------------------- private

  private search(container: ContainerShape, id: string): Shape | null {
    for (const child of container.children) {
      if (child.id === id) return child;
      if (child instanceof ContainerShape) {
        const found = this.search(child, id);
        if (found !== null) return found;
      }
    }
    return null;
  }
}
