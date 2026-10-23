import { ContainerShape } from './ContainerShape.js';

/**
 * The `<svg>` element of the document.
 *
 * It is a container so that every shape always has a parent container: the
 * tree has a single uniform shape and commands never special-case "top level".
 * It has no id and cannot be addressed by a command.
 */
export class RootNode extends ContainerShape {
  constructor() {
    super('');
  }

  override get tagName(): string {
    return 'svg';
  }

  override get reference(): string {
    return 'svg';
  }
}
