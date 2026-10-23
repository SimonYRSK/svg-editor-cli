import { EditorError } from './EditorError.js';

/**
 * Thrown when a `create` command names a shape type that no registered ShapeProvider owns.
 */
export class UnknownShapeTypeError extends EditorError {
  override readonly code = 'unknown-shape-type';
  readonly typeName: string;

  constructor(typeName: string) {
    super(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    this.typeName = typeName;
  }
}
