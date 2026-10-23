import { EditorError } from './EditorError.js';

/**
 * Thrown when undo is requested while the undo stack is empty.
 */
export class NothingToUndoError extends EditorError {
  override readonly code = 'nothing-to-undo';

  constructor() {
    super(`nothing to undo`);
  }
}
