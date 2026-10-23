import { UsageError } from '../../model/errors/UsageError.js';
import type { FileStore } from '../../io/FileStore.js';
import type { SvgReader } from '../../io/SvgReader.js';
import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';

/** `read <file.svg>`: replaces the session with the content of an SVG file. */
export class ReadCommand implements Command {
  readonly name = 'read';
  readonly syntax = 'read <file.svg>';
  readonly summary = 'open an SVG file as the current document';

  private readonly files: FileStore;
  private readonly reader: SvgReader;

  constructor(files: FileStore, reader: SvgReader) {
    this.files = files;
    this.reader = reader;
  }

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 1) throw new UsageError(this.syntax);
    const path = args[0];
    const text = this.files.readText(path);
    const result = this.reader.read(text);
    editor.open(result.document, path);
    const summary = `read ${path} (${result.document.countShapes()} elements)`;
    return [...result.warnings, summary].join('\n');
  }
}
