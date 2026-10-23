import { Line } from '../Line.js';
import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';

/** Kernel provider for `<line>` (its optional 5th parameter is a stroke colour). */
export class LineProvider extends ShapeProviderBase {
  readonly typeName = 'line';
  readonly usage = 'create line <id> <x1> <y1> <x2> <y2> [stroke]';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [4, 5]);
    const line = new Line(
      id,
      this.numberParam(params, 0),
      this.numberParam(params, 1),
      this.numberParam(params, 2),
      this.numberParam(params, 3),
    );
    if (params.length === 5) line.setStroke(params[4]);
    return line;
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>): Shape {
    const line = new Line(
      id,
      this.numericAttribute(attributes, 'x1'),
      this.numericAttribute(attributes, 'y1'),
      this.numericAttribute(attributes, 'x2'),
      this.numericAttribute(attributes, 'y2'),
    );
    line.loadAttributes(attributes);
    return line;
  }
}
