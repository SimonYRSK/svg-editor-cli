import { EditorError } from './EditorError.js';

/**
 * Thrown when a command would introduce an id that is already present in the document.
 */
export class DuplicateIdError extends EditorError {
  override readonly code = 'duplicate-id';
  readonly id: string;

  constructor(id: string) {
    super(`id already exists: ${id}`);
    this.id = id;
  }
}
