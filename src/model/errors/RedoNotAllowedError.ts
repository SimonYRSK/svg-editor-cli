import { EditorError } from './EditorError.js';

/**
 * Thrown when redo is requested after a document-level (io) command invalidated the history.
 */
export class RedoNotAllowedError extends EditorError {
  override readonly code = 'redo-not-allowed';

  constructor() {
    super(`redo not allowed after io command`);
  }
}
