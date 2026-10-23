import { EditorError } from './EditorError.js';

/**
 * Thrown when a command needs a current document but neither init nor read has run yet.
 */
export class NoDocumentError extends EditorError {
  override readonly code = 'no-document';

  constructor() {
    super(`no document. use 'init' or 'read' first`);
  }
}
