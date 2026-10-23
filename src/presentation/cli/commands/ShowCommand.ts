import { UsageError } from '../../../model/errors/UsageError.js';
import type { Command } from '../../../app/Command.js';
import type { Editor } from '../../../app/Editor.js';
import type { ShowFormatter } from '../ShowFormatter.js';

/** `show <id>`: every attribute of one shape. */
export class ShowCommand implements Command {
  readonly name = 'show';
  readonly syntax = 'show <id>';
  readonly summary = 'show all attributes of one shape';

  private readonly formatter: ShowFormatter;

  constructor(formatter: ShowFormatter) {
    this.formatter = formatter;
  }

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    return this.formatter.format(document.require(args[0]));
  }
}
