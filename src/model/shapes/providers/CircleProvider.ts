import { Circle } from '../Circle.js';
import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';

/** Kernel provider for `<circle>`. */
export class CircleProvider extends ShapeProviderBase {
  readonly typeName = 'circle';
  readonly usage = 'create circle <id> <cx> <cy> <r> [fill]';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [3, 4]);
    const circle = new Circle(
      id,
      this.numberParam(params, 0),
      this.numberParam(params, 1),
      this.measureParam(params, 2),
    );
    if (params.length === 4) circle.setFill(params[3]);
    return circle;
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>): Shape {
    const circle = new Circle(
      id,
      this.numericAttribute(attributes, 'cx'),
      this.numericAttribute(attributes, 'cy'),
      this.measureAttribute(attributes, 'r'),
    );
    circle.loadAttributes(attributes);
    return circle;
  }
}
