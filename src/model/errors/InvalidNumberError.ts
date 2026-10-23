import { EditorError } from './EditorError.js';

/**
 * Thrown when a numeric argument cannot be parsed as a finite number.
 */
export class InvalidNumberError extends EditorError {
  override readonly code = 'invalid-number';
  readonly raw: string;

  constructor(raw: string) {
    super(`invalid number: ${raw}`);
    this.raw = raw;
  }
}
