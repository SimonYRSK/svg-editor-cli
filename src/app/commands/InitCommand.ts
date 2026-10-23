import { Document } from '../../model/document/Document.js';
import { InvalidMeasureError } from '../../model/errors/InvalidMeasureError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `init [w] [h]`: replaces the session with a new empty canvas. */
export class InitCommand implements Command {
  readonly name = 'init';
  readonly syntax = 'init [w] [h]';
  readonly summary = 'new empty canvas (default 800x600)';

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 0 && args.length !== 2) throw new UsageError(this.syntax);
    const width = args.length === 2 ? NumberText.parseMeasure(args[0]) : 800;
    const height = args.length === 2 ? NumberText.parseMeasure(args[1]) : 600;
    if (width <= 0) throw new InvalidMeasureError(args[0] as string);
    if (height <= 0) throw new InvalidMeasureError(args[1] as string);
    editor.open(new Document(width, height));
    return `canvas ${NumberText.format(width)}x${NumberText.format(height)} created`;
  }
}
