import { EditorError } from './EditorError.js';

/**
 * Thrown when a command needs a container but the addressed shape is a leaf shape.
 */
export class NotAContainerError extends EditorError {
  override readonly code = 'not-a-container';
  readonly id: string;

  constructor(id: string) {
    super(`not a container: ${id}`);
    this.id = id;
  }
}
