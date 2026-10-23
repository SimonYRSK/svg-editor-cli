import { EditorError } from './EditorError.js';

/**
 * Thrown when `ungroup` addresses a composite shape whose internal parts are owned by its provider.
 */
export class UngroupCompositeError extends EditorError {
  override readonly code = 'ungroup-composite';
  readonly id: string;

  constructor(id: string) {
    super(`cannot ungroup composite shape: ${id}`);
    this.id = id;
  }
}
