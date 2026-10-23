import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';

/**
 * Renders `show <id>`: identity and parent on the first line, then one block for
 * geometry, style and any attribute preserved from a foreign SVG file.
 */
export class ShowFormatter {
  private static readonly INDENT = '  ';

  format(shape: Shape): string {
    const parent = shape.parent === null ? 'svg' : shape.parent.reference;
    const lines: string[] = [`${shape.reference}  parent=${parent}`];

    const geometry = shape.describeGeometry();
    if (geometry.length > 0) lines.push(`${ShowFormatter.INDENT}${geometry}`);

    for (const [name, value] of shape.stylePairs()) {
      lines.push(`${ShowFormatter.INDENT}${name}=${value}`);
    }
    for (const [name, value] of shape.preserved) {
      lines.push(`${ShowFormatter.INDENT}${name}=${value}`);
    }
    if (shape instanceof ContainerShape) {
      lines.push(`${ShowFormatter.INDENT}children=${shape.childCount}`);
    }
    return lines.join('\n');
  }
}
