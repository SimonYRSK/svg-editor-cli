import { EditCommand } from '../../app/EditCommand.js';
import type { CommandRegistry } from '../../app/CommandRegistry.js';
import type { Editor } from '../../app/Editor.js';
import { EditorError } from '../../model/errors/EditorError.js';
import { ExitCommand } from './commands/ExitCommand.js';
import { Interpretation } from './Interpretation.js';
import { LineTokenizer } from './LineTokenizer.js';

/**
 * The invoker of the Command pattern: one line in, transcript lines out.
 *
 * It performs, in order: comment / blank line filter, tokenising, lookup in the
 * command registry, execution, and — only when the executed command is an
 * `EditCommand` — pushing that very object onto the undo stack. Errors never
 * escape as exceptions: an `EditorError` becomes one `error: ...` line, which is
 * how the assignment's "a failed command changes nothing" rule is kept.
 */
export class LineInterpreter {
  private readonly registry: CommandRegistry;
  private readonly editor: Editor;
  private readonly tokenizer = new LineTokenizer();

  constructor(registry: CommandRegistry, editor: Editor) {
    this.registry = registry;
    this.editor = editor;
  }

  interpret(line: string): Interpretation {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) return Interpretation.silent();

    try {
      const tokens = this.tokenizer.tokenize(line);
      const name = tokens[0];
      if (name === undefined) return Interpretation.silent();
      const command = this.registry.resolve(name);
      const output = command.execute(tokens.slice(1), this.editor);
      if (command instanceof EditCommand) this.editor.history.record(command);
      return new Interpretation(LineInterpreter.splitLines(output), command instanceof ExitCommand);
    } catch (error) {
      return new Interpretation([LineInterpreter.describe(error)]);
    }
  }

  private static splitLines(output: string): string[] {
    return output.length === 0 ? [] : output.split('\n');
  }

  private static describe(error: unknown): string {
    if (error instanceof EditorError) return `error: ${error.message}`;
    const detail = error instanceof Error ? error.message : String(error);
    return `error: internal failure: ${detail}`;
  }
}
