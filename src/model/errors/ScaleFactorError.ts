import { EditorError } from './EditorError.js';

/**
 * Thrown when `scale` receives a factor that is not strictly positive.
 */
export class ScaleFactorError extends EditorError {
  override readonly code = 'invalid-scale-factor';

  constructor() {
    super(`scale factor must be positive`);
  }
}
