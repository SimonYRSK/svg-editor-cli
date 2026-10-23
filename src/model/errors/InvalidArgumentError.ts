import { EditorError } from './EditorError.js';

/**
 * Thrown when a command line cannot be split into arguments (for example an unterminated quote).
 */
export class InvalidArgumentError extends EditorError {
  override readonly code = 'invalid-argument';
  readonly detail: string;

  constructor(detail: string) {
    super(`invalid argument: ${detail}`);
    this.detail = detail;
  }
}
