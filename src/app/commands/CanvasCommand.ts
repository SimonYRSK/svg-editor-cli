import { InvalidMeasureError } from '../../model/errors/InvalidMeasureError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `canvas [w] [h]`: shows the canvas size, or resizes it. */
export class CanvasCommand implements Command {
  readonly name = 'canvas';
  readonly syntax = 'canvas [w] [h]';
  readonly summary = 'show the canvas size, or resize it with two arguments';

  execute(args: readonly string[], editor: Editor): string {
    const document = editor.requireDocument();
    if (args.length === 0) {
      return `canvas ${NumberText.format(document.width)}x${NumberText.format(document.height)}`;
    }
    if (args.length !== 2) throw new UsageError(this.syntax);
    const width = NumberText.parseMeasure(args[0]);
    const height = NumberText.parseMeasure(args[1]);
    if (width <= 0) throw new InvalidMeasureError(args[0]);
    if (height <= 0) throw new InvalidMeasureError(args[1]);
    document.resize(width, height);
    editor.history.lockAfterIo();
    return `canvas resized to ${NumberText.format(width)}x${NumberText.format(height)}`;
  }
}
