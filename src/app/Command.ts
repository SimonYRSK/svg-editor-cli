import type { Editor } from './Editor.js';

/**
 * The Command pattern's participant interface (the assignment requires it).
 *
 * A command object knows its own name, its syntax and how to run itself against
 * the current editor session; the invoker (the line interpreter) only looks the
 * object up by name and calls `execute`.
 */
export interface Command {
  /** Name typed on the command line. */
  readonly name: string;

  /** Syntax line shown by `help` and used inside usage errors. */
  readonly syntax: string;

  /** One line of prose shown by `help`. */
  readonly summary: string;

  /**
   * Runs the command.
   * @returns the transcript text (multiple lines joined by `\n`)
   * @throws EditorError for every expected failure; the caller turns it into
   *         `error: ...` and no state has been changed by then.
   */
  execute(args: readonly string[], editor: Editor): string;
}
