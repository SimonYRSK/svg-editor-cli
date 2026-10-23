import { EditorError } from './EditorError.js';

/**
 * Thrown when a length or width must be finite and non-negative but is not.
 */
export class InvalidMeasureError extends EditorError {
  override readonly code = 'invalid-measure';
  readonly raw: string;

  constructor(raw: string) {
    super(`invalid measure: ${raw} (must be a non-negative number)`);
    this.raw = raw;
  }
}
