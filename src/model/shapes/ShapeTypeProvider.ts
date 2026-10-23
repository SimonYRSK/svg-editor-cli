import type { Shape } from './Shape.js';

/**
 * The seam a shape type plugs into (kernel types today, plugin types later).
 *
 * A provider owns everything type specific: the CLI parameter schema used by
 * `create`, the construction from SVG attributes used by `read`, and the
 * instance itself.  The kernel therefore never switches on a type name — it
 * asks the registry for a provider and calls this interface.
 */
export interface ShapeTypeProvider {
  /** Type name as typed by the user (`rect`, `circle`, ...). */
  readonly typeName: string;

  /** Full `create` syntax of this type, shown by `help` and by usage errors. */
  readonly usage: string;

  /** Builds the shape from `create` positional parameters, validating them. */
  createFromParams(id: string, params: readonly string[]): Shape;

  /** Builds the shape from attributes of an SVG file element. */
  createFromAttributes(id: string, attributes: ReadonlyMap<string, string>, textContent: string | null): Shape;
}
