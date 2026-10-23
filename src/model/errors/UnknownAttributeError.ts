import { EditorError } from './EditorError.js';

/**
 * Thrown when `set` receives an attribute outside the whitelist of the addressed shape.
 */
export class UnknownAttributeError extends EditorError {
  override readonly code = 'unknown-attribute';
  readonly attribute: string;

  constructor(attribute: string) {
    super(`unknown attribute: ${attribute}`);
    this.attribute = attribute;
  }
}
