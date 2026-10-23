import { EditorError } from './EditorError.js';

/**
 * Thrown when `ungroup` addresses a container that is a direct child of the svg root.
 */
export class UngroupTopLevelError extends EditorError {
  override readonly code = 'ungroup-top-level';
  readonly id: string;

  constructor(id: string) {
    super(`cannot ungroup top-level container: ${id}`);
    this.id = id;
  }
}
