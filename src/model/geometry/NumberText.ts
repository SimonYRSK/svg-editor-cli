import { InvalidMeasureError } from '../errors/InvalidMeasureError.js';
import { InvalidNumberError } from '../errors/InvalidNumberError.js';

/**
 * A value object for reading and rendering the numeric coordinates of a
 * drawing.  All numbers keep at most six decimals so that repeated
 * `scale`/`move` round trips do not accumulate floating point noise, and so
 * that printed transcripts stay stable.
 */
export class NumberText {
  private static readonly STRICT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  private static readonly LEADING = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
  private static readonly DECIMALS = 6;

  private constructor() {}

  /**
   * Parses a user supplied argument.  Throws `InvalidNumberError` when the
   * text is not a finite number, so a command can fail before touching state.
   */
  static parse(raw: string): number {
    const text = raw.trim();
    if (!NumberText.STRICT.test(text)) {
      throw new InvalidNumberError(raw);
    }
    const value = Number(text);
    if (!Number.isFinite(value)) {
      throw new InvalidNumberError(raw);
    }
    return value;
  }

  /** Parses a measure that must be finite and non-negative (`width`, `height`, `stroke-width`). */
  static parseMeasure(raw: string): number {
    const value = NumberText.parse(raw);
    if (value < 0) {
      throw new InvalidMeasureError(raw);
    }
    return value;
  }

  /**
   * Lenient variant used when importing foreign SVG files: tolerates unit
   * suffixes (`12px`, `50%`) and returns null when nothing numeric is found.
   */
  static readLenient(raw: string | null | undefined): number | null {
    if (raw === null || raw === undefined) return null;
    const match = NumberText.LEADING.exec(raw.trim());
    if (!match) return null;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : null;
  }

  /** Renders a number the way it should appear in saved SVG and in transcripts. */
  static format(value: number): string {
    if (!Number.isFinite(value)) return '0';
    const rounded = Number(value.toFixed(NumberText.DECIMALS));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }
}
