import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { LineInterpreter } from './LineInterpreter.js';

/**
 * The terminal loop: banner, `svg> ` prompt, one line at a time.
 *
 * Streams are injected, so the REPL can be driven by a pipe in a test without
 * touching the real terminal.
 */
export class Repl {
  private static readonly PROMPT = 'svg> ';
  private static readonly BANNER = "svg-editor 0.1 — type 'help' for commands";

  private readonly input: Readable;
  private readonly output: Writable;
  private readonly interpreter: LineInterpreter;

  constructor(input: Readable, output: Writable, interpreter: LineInterpreter) {
    this.input = input;
    this.output = output;
    this.interpreter = interpreter;
  }

  run(): Promise<void> {
    this.output.write(`${Repl.BANNER}\n\n`);
    const reader = createInterface({
      input: this.input,
      output: this.output,
      prompt: Repl.PROMPT,
      terminal: false,
    });

    return new Promise<void>((resolve) => {
      reader.on('line', (line: string) => {
        const result = this.interpreter.interpret(line);
        for (const text of result.lines) this.output.write(`${text}\n`);
        if (result.exitRequested) {
          reader.close();
          return;
        }
        reader.prompt();
      });
      reader.on('close', () => resolve());
      reader.prompt();
    });
  }
}
