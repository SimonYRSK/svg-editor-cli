import { EditorError } from './EditorError.js';

/**
 * Thrown when the file store cannot write the requested path.
 */
export class FileWriteError extends EditorError {
  override readonly code = 'file-write';
  readonly path: string;

  constructor(path: string) {
    super(`cannot write file: ${path}`);
    this.path = path;
  }
}
