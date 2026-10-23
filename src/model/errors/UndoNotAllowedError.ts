import { EditorError } from './EditorError.js';

/**
 * Thrown when undo is requested after a document-level (io) command invalidated the history.
 */
export class UndoNotAllowedError extends EditorError {
  override readonly code = 'undo-not-allowed';

  constructor() {
    super(`undo not allowed after io command`);
  }
}
