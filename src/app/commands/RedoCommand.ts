import { UsageError } from '../../model/errors/UsageError.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `redo`: re-applies the command undone last (cleared by any new edit). */
export class RedoCommand implements Command {
  readonly name = 'redo';
  readonly syntax = 'redo';
  readonly summary = 'redo the command undone last';

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 0) throw new UsageError(this.syntax);
    editor.requireDocument();
    return editor.history.redo();
  }
}
