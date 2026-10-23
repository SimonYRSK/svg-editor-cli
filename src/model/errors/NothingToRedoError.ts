import { EditorError } from './EditorError.js';

/**
 * Thrown when redo is requested while the redo stack is empty.
 */
export class NothingToRedoError extends EditorError {
  override readonly code = 'nothing-to-redo';

  constructor() {
    super(`nothing to redo`);
  }
}
