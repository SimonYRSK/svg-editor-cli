import type { ContainerShape } from '../shapes/ContainerShape.js';

/** Where a shape sits in the tree: which container, and at which z-order index. */
export interface Placement {
  readonly parent: ContainerShape;
  readonly index: number;
}
