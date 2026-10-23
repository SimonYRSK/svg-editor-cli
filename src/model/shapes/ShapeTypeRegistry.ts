import { UnknownShapeTypeError } from '../errors/UnknownShapeTypeError.js';
import type { ShapeTypeProvider } from './ShapeTypeProvider.js';

/**
 * Type name -> provider table.
 *
 * This is one of the two places where the kernel dispatches by name (the other
 * is `CommandRegistry`).  Both are deliberate plugin seams: a future
 * ShapeProvider plugin only has to `register` here, it never edits a `switch`.
 */
export class ShapeTypeRegistry {
  private readonly providersByName = new Map<string, ShapeTypeProvider>();

  register(provider: ShapeTypeProvider): void {
    if (this.providersByName.has(provider.typeName)) {
      throw new Error(`shape type already registered: ${provider.typeName}`);
    }
    this.providersByName.set(provider.typeName, provider);
  }

  has(typeName: string): boolean {
    return this.providersByName.has(typeName);
  }

  /** @throws UnknownShapeTypeError when no provider owns the type. */
  resolve(typeName: string): ShapeTypeProvider {
    const provider = this.providersByName.get(typeName);
    if (provider === undefined) {
      throw new UnknownShapeTypeError(typeName);
    }
    return provider;
  }

  list(): readonly ShapeTypeProvider[] {
    return [...this.providersByName.values()];
  }
}
