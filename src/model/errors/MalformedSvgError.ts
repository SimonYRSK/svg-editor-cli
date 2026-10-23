import { EditorError } from './EditorError.js';

/**
 * Thrown when imported text is not well-formed enough to be read as an SVG document.
 */
export class MalformedSvgError extends EditorError {
  override readonly code = 'malformed-svg';
  readonly detail: string;

  constructor(detail: string) {
    super(`cannot parse svg: ${detail}`);
    this.detail = detail;
  }
}
