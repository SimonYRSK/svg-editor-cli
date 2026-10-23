import { EditorError } from './EditorError.js';

/**
 * Thrown when `group` would place a container together with one of its own descendants.
 */
export class GroupCycleError extends EditorError {
  override readonly code = 'group-cycle';
  readonly id: string;

  constructor(id: string) {
    super(`cannot group a container into its own descendant: ${id}`);
    this.id = id;
  }
}
