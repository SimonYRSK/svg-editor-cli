/** What one input line produced: the lines to print, and whether to leave the REPL. */
export class Interpretation {
  readonly lines: readonly string[];
  readonly exitRequested: boolean;

  constructor(lines: readonly string[], exitRequested = false) {
    this.lines = lines;
    this.exitRequested = exitRequested;
  }

  static silent(): Interpretation {
    return new Interpretation([], false);
  }
}
