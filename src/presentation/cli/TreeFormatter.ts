import type { Document } from '../../model/document/Document.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';

/** One rendered row of the structure tree. */
interface TreeLine {
  readonly prefix: string;
  readonly label: string;
  readonly attributes: string;
}

/**
 * Renders `tree` / `tree <id>`.
 *
 * Geometry is inlined next to every shape (an editor tree without coordinates
 * is useless when the canvas is not visible), and attribute columns are aligned
 * across the whole tree: the widest `prefix + label` decides the column, so a
 * deep tree still reads as a table.
 */
export class TreeFormatter {
  private static readonly BRANCH = '├── ';
  private static readonly LAST_BRANCH = '└── ';
  private static readonly VERTICAL = '│   ';
  private static readonly BLANK = '    ';
  private static readonly GAP = 2;

  format(document: Document): string {
    const lines: TreeLine[] = [
      {
        prefix: '',
        label: `svg (${NumberText.format(document.width)}x${NumberText.format(document.height)})`,
        attributes: '',
      },
    ];
    this.collectChildren(document.root, '', lines);
    return this.render(lines);
  }

  formatSubtree(shape: Shape): string {
    const lines: TreeLine[] = [
      { prefix: '', label: shape.reference, attributes: TreeFormatter.attributesOf(shape) },
    ];
    if (shape instanceof ContainerShape) {
      this.collectChildren(shape, '', lines);
    }
    return this.render(lines);
  }

  // -------------------------------------------------------------- internals

  private collectChildren(container: ContainerShape, indent: string, lines: TreeLine[]): void {
    const children = container.children;
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const branch = isLast ? TreeFormatter.LAST_BRANCH : TreeFormatter.BRANCH;
      lines.push({
        prefix: `${indent}${branch}`,
        label: child.reference,
        attributes: TreeFormatter.attributesOf(child),
      });
      if (child instanceof ContainerShape && child.childCount > 0) {
        const continuation = isLast ? TreeFormatter.BLANK : TreeFormatter.VERTICAL;
        this.collectChildren(child, `${indent}${continuation}`, lines);
      }
    });
  }

  private render(lines: readonly TreeLine[]): string {
    const column = lines.reduce((widest, line) => {
      if (line.attributes.length === 0) return widest;
      const width = line.prefix.length + line.label.length + TreeFormatter.GAP;
      return Math.max(widest, width);
    }, 0);

    return lines
      .map((line) => {
        const head = `${line.prefix}${line.label}`;
        if (line.attributes.length === 0) return head;
        return `${head}${' '.repeat(column - head.length)}${line.attributes}`;
      })
      .join('\n');
  }

  /** Geometry (type specific wording) followed by the style attributes. */
  private static attributesOf(shape: Shape): string {
    const geometry = shape.describeGeometry();
    const style = shape
      .stylePairs()
      .map(([name, value]) => `${name}=${value}`)
      .join(' ');
    return [geometry, style].filter((part) => part.length > 0).join(' ');
  }
}
