/**
 * Base class of every expected (user-facing) failure of the editor.
 *
 * The CLI turns an `EditorError` into a single line prefixed with `error:`;
 * anything that is *not* an `EditorError` is a bug and is reported as such by
 * the REPL instead of being mistaken for a user mistake.
 */
export abstract class EditorError extends Error {
  /** Stable machine-readable tag, useful for tests and for future transport layers. */
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
