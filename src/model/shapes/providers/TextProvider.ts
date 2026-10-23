import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';
import { Text } from '../Text.js';

/** Kernel provider for `<text>`; the drawn characters are element content. */
export class TextProvider extends ShapeProviderBase {
  readonly typeName = 'text';
  readonly usage = 'create text <id> <x> <y> "content"';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [3]);
    return new Text(id, this.numberParam(params, 0), this.numberParam(params, 1), params[2]);
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>, textContent: string | null): Shape {
    const text = new Text(
      id,
      this.numericAttribute(attributes, 'x'),
      this.numericAttribute(attributes, 'y'),
      textContent ?? '',
    );
    text.loadAttributes(attributes);
    return text;
  }
}
