import { Document } from '../model/document/Document.js';
import { MalformedSvgError } from '../model/errors/MalformedSvgError.js';
import { NumberText } from '../model/geometry/NumberText.js';
import { ContainerShape } from '../model/shapes/ContainerShape.js';
import type { Shape } from '../model/shapes/Shape.js';
import type { ShapeTypeRegistry } from '../model/shapes/ShapeTypeRegistry.js';
import { AutoIdAssigner } from './AutoIdAssigner.js';
import { ReadResult } from './ReadResult.js';
import { XmlElementNode } from './XmlElementNode.js';
import { XmlTreeParser } from './XmlTreeParser.js';

/**
 * Turns SVG text into a `Document`.
 *
 * Reading is the only "import" path into the model, so this class is also the
 * place where the assignment's forgiveness rules live:
 * - an element without `id` gets `tag + n` and a printed warning;
 * - a duplicated `id` gets a fresh one and a warning instead of an abort;
 * - an element type no provider knows (e.g. `<path>` in phase 1) is skipped
 *   with a warning, so foreign files still open.
 *
 * Note that everything the kernel does not model (attributes such as
 * `transform`, `font-size`, `style`) is preserved on the shape, so `read`
 * followed by `save` does not lose information.
 */
export class SvgReader {
  private static readonly DEFAULT_WIDTH = 800;
  private static readonly DEFAULT_HEIGHT = 600;

  private readonly shapeTypes: ShapeTypeRegistry;

  constructor(shapeTypes: ShapeTypeRegistry) {
    this.shapeTypes = shapeTypes;
  }

  read(source: string): ReadResult {
    const rootElement = new XmlTreeParser().parse(source);
    if (rootElement.name !== 'svg') {
      throw new MalformedSvgError(`root element is <${rootElement.name}>, expected <svg>`);
    }
    const document = new Document(this.canvasWidth(rootElement), this.canvasHeight(rootElement));
    const warnings: string[] = [];
    const ids = new AutoIdAssigner();
    this.attachChildren(document, document.root, rootElement, warnings, ids);
    return new ReadResult(document, warnings);
  }

  // ------------------------------------------------------------- structure

  private attachChildren(
    document: Document,
    container: ContainerShape,
    element: XmlElementNode,
    warnings: string[],
    ids: AutoIdAssigner,
  ): void {
    for (const child of element.children) {
      const shape = this.buildShape(document, child, warnings, ids);
      if (shape === null) continue;
      document.insert(shape, container);
    }
  }

  private buildShape(
    document: Document,
    element: XmlElementNode,
    warnings: string[],
    ids: AutoIdAssigner,
  ): Shape | null {
    if (!this.shapeTypes.has(element.name)) {
      warnings.push(`warning: unsupported element <${element.name}> skipped`);
      return null;
    }
    const provider = this.shapeTypes.resolve(element.name);
    const id = this.resolveId(element, warnings, ids);
    const textContent = element.name === 'text' ? element.text.trim() : null;
    const shape = provider.createFromAttributes(id, element.attributes, textContent);
    if (shape instanceof ContainerShape) {
      this.attachChildren(document, shape, element, warnings, ids);
    }
    return shape;
  }

  /** Applies the "auto id" rule of the assignment and reports it. */
  private resolveId(element: XmlElementNode, warnings: string[], ids: AutoIdAssigner): string {
    const rawId = element.attributes.get('id');
    if (rawId === undefined || rawId.length === 0) {
      const assigned = ids.next(element.name);
      warnings.push(`warning: assigned id ${assigned} to unnamed <${element.name}>`);
      return assigned;
    }
    if (ids.isUsed(rawId)) {
      const assigned = ids.next(element.name);
      warnings.push(`warning: duplicate id ${rawId} in file, assigned id ${assigned} to <${element.name}>`);
      return assigned;
    }
    ids.reserve(rawId);
    return rawId;
  }

  // ---------------------------------------------------------------- canvas

  private canvasWidth(root: XmlElementNode): number {
    return (
      NumberText.readLenient(root.attributes.get('width')) ??
      this.viewBoxSize(root, 2) ??
      SvgReader.DEFAULT_WIDTH
    );
  }

  private canvasHeight(root: XmlElementNode): number {
    return (
      NumberText.readLenient(root.attributes.get('height')) ??
      this.viewBoxSize(root, 3) ??
      SvgReader.DEFAULT_HEIGHT
    );
  }

  /** `viewBox="0 0 w h"`: index 2 is the width, index 3 the height. */
  private viewBoxSize(root: XmlElementNode, index: 2 | 3): number | null {
    const viewBox = root.attributes.get('viewBox');
    if (viewBox === undefined) return null;
    const parts = viewBox.trim().split(/[\s,]+/);
    if (parts.length !== 4) return null;
    const value = NumberText.readLenient(parts[index]);
    return value !== null && value > 0 ? value : null;
  }
}
