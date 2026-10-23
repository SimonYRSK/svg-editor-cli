import { EditorError } from './EditorError.js';

/**
 * Thrown when a command refers to a shape id that does not exist in the document.
 */
export class MissingShapeError extends EditorError {
  override readonly code = 'missing-shape';
  readonly id: string;

  constructor(id: string) {
    super(`no such shape: ${id}`);
    this.id = id;
  }
}
