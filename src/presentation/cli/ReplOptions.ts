/** Options of the terminal loop. */
export interface ReplOptions {
  /**
   * Enables readline's line editor (cursor keys, history, proper Ctrl-C).
   * Defaults to whether the input stream is a terminal, so a piped script stays
   * silent while a human at a prompt gets normal editing.
   */
  readonly interactive?: boolean;
}
