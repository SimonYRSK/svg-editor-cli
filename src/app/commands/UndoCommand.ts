import { UsageError } from '../../model/errors/UsageError.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `undo` — reverts the last edit command. */
export class UndoCommand implements Command {
  readonly name = 'undo';
  readonly syntax = 'undo';
  readonly summary = 'undo the last edit command';

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 0) throw new UsageError(this.syntax);
    editor.requireDocument();
    return editor.history.undo();
  }
}
