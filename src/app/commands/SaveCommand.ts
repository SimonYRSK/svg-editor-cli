import { MissingSourcePathError } from '../../model/errors/MissingSourcePathError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import type { FileStore } from '../../io/FileStore.js';
import type { SvgWriter } from '../../io/SvgWriter.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `save [file.svg]` — writes the document; without a path it reuses the last one. */
export class SaveCommand implements Command {
  readonly name = 'save';
  readonly syntax = 'save [file.svg]';
  readonly summary = 'write the document (default: the path it was read from)';

  private readonly files: FileStore;
  private readonly writer: SvgWriter;

  constructor(files: FileStore, writer: SvgWriter) {
    this.files = files;
    this.writer = writer;
  }

  execute(args: readonly string[], editor: Editor): string {
    if (args.length > 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const path = args.length === 1 ? args[0] : document.sourcePath;
    if (path === null) throw new MissingSourcePathError();
    this.files.writeText(path, this.writer.write(document));
    document.setSourcePath(path);
    editor.history.lockAfterIo();
    return `saved to ${path} (${document.countShapes()} elements)`;
  }
}
