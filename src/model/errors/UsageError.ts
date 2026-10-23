import { EditorError } from './EditorError.js';

/**
 * Thrown when a command line does not match the syntax of the command.
 */
export class UsageError extends EditorError {
  override readonly code = 'usage';
  readonly usage: string;

  constructor(usage: string) {
    super(`usage: ${usage}`);
    this.usage = usage;
  }
}
