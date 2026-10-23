import { CircleProvider } from './providers/CircleProvider.js';
import { EllipseProvider } from './providers/EllipseProvider.js';
import { GroupProvider } from './providers/GroupProvider.js';
import { LineProvider } from './providers/LineProvider.js';
import { RectProvider } from './providers/RectProvider.js';
import { TextProvider } from './providers/TextProvider.js';
import { ShapeTypeRegistry } from './ShapeTypeRegistry.js';

/**
 * The six types the phase-1 kernel knows.
 *
 * Registering them is the only line that has to change when a plugin adds a
 * type; `create box ...` currently fails with `unknown shape type: box (is the
 * plugin loaded?)` because nothing is registered under that name.
 */
export class KernelShapeTypes {
  private constructor() {}

  static registerAll(registry: ShapeTypeRegistry): void {
    registry.register(new RectProvider());
    registry.register(new CircleProvider());
    registry.register(new EllipseProvider());
    registry.register(new LineProvider());
    registry.register(new TextProvider());
    registry.register(new GroupProvider());
  }

  static createRegistry(): ShapeTypeRegistry {
    const registry = new ShapeTypeRegistry();
    KernelShapeTypes.registerAll(registry);
    return registry;
  }
}
