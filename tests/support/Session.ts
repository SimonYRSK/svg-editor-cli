import { CompositionRoot } from '../../src/CompositionRoot.js';
import type { Document } from '../../src/model/document/Document.js';
import type { LineInterpreter } from '../../src/presentation/cli/LineInterpreter.js';
import { MemoryFileStore } from './MemoryFileStore.js';

/**
 * A driven editor session for tests: same wiring as `npm run cli`, but the file
 * store is in memory and transcripts are captured line by line.
 */
export class Session {
  readonly files = new MemoryFileStore();
  private readonly root: CompositionRoot;
  private readonly interpreter: LineInterpreter;

  constructor(seed: Readonly<Record<string, string>> = {}) {
    for (const [path, content] of Object.entries(seed)) this.files.writeText(path, content);
    this.root = new CompositionRoot(this.files);
    this.interpreter = this.root.createInterpreter();
  }

  /** Runs one command line and returns the lines it printed. */
  run(line: string): string[] {
    return [...this.interpreter.interpret(line).lines];
  }

  /** Runs a block of lines and returns every line printed. */
  runAll(lines: readonly string[]): string[] {
    return lines.flatMap((line) => this.run(line));
  }

  get document(): Document {
    return this.root.editor.requireDocument();
  }

  get exitRequested(): boolean {
    return this.interpreter.interpret('exit').exitRequested;
  }
}
