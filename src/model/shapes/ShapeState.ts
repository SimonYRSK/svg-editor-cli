import type { NamedValue } from './NamedValue.js';

/**
 * Memento of a single shape's own mutable data.
 *
 * A state never contains children: structure is captured by the structural
 * mementos of the commands (parent + index), so a state stays small and can be
 * restored without rebuilding the tree.
 */
export interface ShapeState {
  readonly geometry: readonly NamedValue[];
  readonly fill: string | null;
  readonly stroke: string | null;
  readonly strokeWidth: number | null;
  readonly content: string | null;
}
