import type { Document } from '../model/document/Document.js';
import { NumberText } from '../model/geometry/NumberText.js';
import { ContainerShape } from '../model/shapes/ContainerShape.js';
import type { Shape } from '../model/shapes/Shape.js';

/**
 * Serializes a `Document` into SVG text.
 *
 * The writer is deliberately dumb: it asks each shape for its own attributes
 * (`toXmlAttributes`) and for its own text (`textContent`), so adding a shape
 * type never means touching this class.
 */
export class SvgWriter {
  private static readonly INDENT = '  ';

  write(document: Document): string {
    const width = NumberText.format(document.width);
    const height = NumberText.format(document.height);
    const header =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"` +
      ` viewBox="0 0 ${width} ${height}"`;

    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    const children = document.root.children;
    if (children.length === 0) {
      lines.push(`${header}/>`);
    } else {
      lines.push(`${header}>`);
      for (const child of children) lines.push(...this.renderShape(child, 1));
      lines.push('</svg>');
    }
    return `${lines.join('\n')}\n`;
  }

  private renderShape(shape: Shape, depth: number): string[] {
    const indent = SvgWriter.INDENT.repeat(depth);
    const open = `${indent}<${shape.tagName}${this.renderAttributes(shape)}`;

    if (shape instanceof ContainerShape && shape.childCount > 0) {
      const lines: string[] = [`${open}>`];
      for (const child of shape.children) lines.push(...this.renderShape(child, depth + 1));
      lines.push(`${indent}</${shape.tagName}>`);
      return lines;
    }

    const content = shape.textContent;
    if (content !== null && content.length > 0) {
      return [`${open}>${SvgWriter.escapeText(content)}</${shape.tagName}>`];
    }
    return [`${open}/>`];
  }

  private renderAttributes(shape: Shape): string {
    return shape
      .toXmlAttributes()
      .map(([name, value]) => ` ${name}="${SvgWriter.escapeAttribute(value)}"`)
      .join('');
  }

  private static escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private static escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
