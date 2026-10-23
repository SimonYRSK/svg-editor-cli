import type { Command } from '../../../app/Command.js';
import type { Editor } from '../../../app/Editor.js';

/**
 * `exit` (also reachable as `quit`) — leaves the REPL.
 *
 * Leaving is a session action, not a document edit, so this command prints
 * nothing: the interpreter recognises the instance and ends the loop.
 */
export class ExitCommand implements Command {
  readonly name = 'exit';
  readonly syntax = 'exit | quit';
  readonly summary = 'leave the editor (Ctrl-D does the same)';

  execute(_args: readonly string[], _editor: Editor): string {
    return '';
  }
}
