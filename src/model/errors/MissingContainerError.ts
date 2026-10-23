import { EditorError } from './EditorError.js';

/**
 * Thrown when a `create ... in <id>` clause names a container that does not exist.
 */
export class MissingContainerError extends EditorError {
  override readonly code = 'missing-container';
  readonly id: string;

  constructor(id: string) {
    super(`no such container: ${id}`);
    this.id = id;
  }
}
