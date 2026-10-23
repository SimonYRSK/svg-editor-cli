import { Ellipse } from '../Ellipse.js';
import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';

/** Kernel provider for `<ellipse>`. */
export class EllipseProvider extends ShapeProviderBase {
  readonly typeName = 'ellipse';
  readonly usage = 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [4, 5]);
    const ellipse = new Ellipse(
      id,
      this.numberParam(params, 0),
      this.numberParam(params, 1),
      this.measureParam(params, 2),
      this.measureParam(params, 3),
    );
    if (params.length === 5) ellipse.setFill(params[4]);
    return ellipse;
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>): Shape {
    const ellipse = new Ellipse(
      id,
      this.numericAttribute(attributes, 'cx'),
      this.numericAttribute(attributes, 'cy'),
      this.measureAttribute(attributes, 'rx'),
      this.measureAttribute(attributes, 'ry'),
    );
    ellipse.loadAttributes(attributes);
    return ellipse;
  }
}
