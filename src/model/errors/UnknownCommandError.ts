import { EditorError } from './EditorError.js';

/**
 * Thrown when the first token of a command line is not a registered command name.
 */
export class UnknownCommandError extends EditorError {
  override readonly code = 'unknown-command';
  readonly commandName: string;

  constructor(commandName: string) {
    super(`unknown command: ${commandName} (type 'help')`);
    this.commandName = commandName;
  }
}
