import { ContainerShape } from './ContainerShape.js';

/** Kernel container type `<g>`: addressable, movable, and dissolvable with `ungroup`. */
export class Group extends ContainerShape {
  constructor(id: string) {
    super(id);
  }

  override get tagName(): string {
    return 'g';
  }

  override get supportsUngroup(): boolean {
    return true;
  }
}
