import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { LineInterpreter } from './LineInterpreter.js';
import type { ReplOptions } from './ReplOptions.js';

/**
 * The terminal loop: banner, `svg> ` prompt, one line at a time.
 *
 * Two modes, chosen by whether the input is a terminal:
 * - interactive (a human typed `npm run cli`): readline owns the line editor, so
 *   cursor keys, history and Ctrl-C behave as expected, and the prompt is shown;
 * - scripted (`npm run cli < session.txt`): the prompt is suppressed so the
 *   transcript contains only command output, which is what makes the example
 *   sessions in `examples/` comparable line by line.
 *
 * Streams are injected, so both modes are covered by tests without a terminal.
 */
export class Repl {
  private static readonly PROMPT = 'svg> ';
  private static readonly BANNER = "svg-editor 0.1 — type 'help' for commands";

  private readonly input: Readable;
  private readonly output: Writable;
  private readonly interpreter: LineInterpreter;
  private readonly interactive: boolean;

  constructor(
    input: Readable,
    output: Writable,
    interpreter: LineInterpreter,
    options: ReplOptions = {},
  ) {
    this.input = input;
    this.output = output;
    this.interpreter = interpreter;
    this.interactive = options.interactive ?? Repl.isTerminal(input);
  }

  run(): Promise<void> {
    this.output.write(`${Repl.BANNER}\n\n`);
    const reader = createInterface({
      input: this.input,
      output: this.output,
      prompt: Repl.PROMPT,
      terminal: this.interactive,
    });

    return new Promise<void>((resolve) => {
      const ask = (): void => {
        if (this.interactive) reader.prompt();
      };
      reader.on('line', (line: string) => {
        const result = this.interpreter.interpret(line);
        for (const text of result.lines) this.output.write(`${text}\n`);
        if (result.exitRequested) {
          reader.close();
          return;
        }
        ask();
      });
      reader.on('SIGINT', () => {
        this.output.write('\n');
        reader.close();
      });
      reader.on('close', () => resolve());
      ask();
    });
  }

  private static isTerminal(input: Readable): boolean {
    return (input as Readable & { isTTY?: boolean }).isTTY === true;
  }
}
