import { UsageError } from '../../../model/errors/UsageError.js';
import type { Command } from '../../../app/Command.js';
import type { Editor } from '../../../app/Editor.js';
import type { TreeFormatter } from '../TreeFormatter.js';

/** `tree [id]` — structure of the whole document, or of one subtree. */
export class TreeCommand implements Command {
  readonly name = 'tree';
  readonly syntax = 'tree [id]';
  readonly summary = 'show the structure tree with inline geometry';

  private readonly formatter: TreeFormatter;

  constructor(formatter: TreeFormatter) {
    this.formatter = formatter;
  }

  execute(args: readonly string[], editor: Editor): string {
    if (args.length > 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    if (args.length === 0) return this.formatter.format(document);
    return this.formatter.formatSubtree(document.require(args[0]));
  }
}
