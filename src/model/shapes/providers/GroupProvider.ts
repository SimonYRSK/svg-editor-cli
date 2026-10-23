import { Group } from '../Group.js';
import { ShapeProviderBase } from '../ShapeProviderBase.js';
import type { Shape } from '../Shape.js';

/** Kernel provider for the empty container `<g>` created by `create g <id>`. */
export class GroupProvider extends ShapeProviderBase {
  readonly typeName = 'g';
  readonly usage = 'create g <id> [in <containerId>]';

  createFromParams(id: string, params: readonly string[]): Shape {
    this.requireParams(params, [0]);
    return new Group(id);
  }

  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>): Shape {
    const group = new Group(id);
    group.loadAttributes(attributes);
    return group;
  }
}
