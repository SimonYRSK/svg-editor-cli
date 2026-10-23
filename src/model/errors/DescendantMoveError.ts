import { EditorError } from './EditorError.js';

/**
 * Thrown when `addto` would move a container into itself or into one of its own descendants.
 */
export class DescendantMoveError extends EditorError {
  override readonly code = 'descendant-move';
  readonly id: string;

  constructor(id: string) {
    super(`cannot move a container into its own descendant: ${id}`);
    this.id = id;
  }
}
