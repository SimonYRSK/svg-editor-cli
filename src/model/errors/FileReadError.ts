import { EditorError } from './EditorError.js';

/**
 * Thrown when the file store cannot read the requested path.
 */
export class FileReadError extends EditorError {
  override readonly code = 'file-read';
  readonly path: string;

  constructor(path: string) {
    super(`cannot read file: ${path}`);
    this.path = path;
  }
}
