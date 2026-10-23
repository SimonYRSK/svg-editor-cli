import { Rect } from '../Rect.js';
import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';

/** Kernel provider for `<rect>`. */
export class RectProvider extends ShapeProviderBase {
  readonly typeName = 'rect';
  readonly usage = 'create rect <id> <x> <y> <w> <h> [fill]';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [4, 5]);
    const rect = new Rect(
      id,
      this.numberParam(params, 0),
      this.numberParam(params, 1),
      this.measureParam(params, 2),
      this.measureParam(params, 3),
    );
    if (params.length === 5) rect.setFill(params[4]);
    return rect;
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>): Shape {
    const rect = new Rect(
      id,
      this.numericAttribute(attributes, 'x'),
      this.numericAttribute(attributes, 'y'),
      this.measureAttribute(attributes, 'width'),
      this.measureAttribute(attributes, 'height'),
    );
    rect.loadAttributes(attributes);
    return rect;
  }
}
