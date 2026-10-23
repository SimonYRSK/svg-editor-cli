import { EditorError } from './EditorError.js';

/**
 * Thrown when `save` runs without a path and the document was never read from or saved to a file.
 */
export class MissingSourcePathError extends EditorError {
  override readonly code = 'missing-source-path';

  constructor() {
    super(`no source path, use 'save <file>'`);
  }
}
