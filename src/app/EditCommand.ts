import { ContainerShape } from '../model/shapes/ContainerShape.js';
import type { Shape } from '../model/shapes/Shape.js';
import type { ShapeState } from '../model/shapes/ShapeState.js';
import type { Command } from './Command.js';
import type { Editor } from './Editor.js';

/** One shape together with the state it had before a command ran. */
export interface ShapeStateEntry {
  readonly shape: Shape;
  readonly state: ShapeState;
}

/**
 * A command that changes the document, and can therefore be undone.
 *
 * The three methods form the undo contract of the assignment: one command
 * object is one undo unit, `undo` reverts exactly the change made by the last
 * `execute`, and `redo` applies it again.  Commands capture the state they need
 * at execution time (shape mementos, or parent + index for structural changes),
 * which is what makes `undo`/`redo` symmetric and repeatable.
 */
export abstract class EditCommand implements Command {
  abstract readonly name: string;
  abstract readonly syntax: string;
  abstract readonly summary: string;

  abstract execute(args: readonly string[], editor: Editor): string;

  /** Reverts the change and returns the transcript text describing the revert. */
  abstract undo(): string;

  /** Re-applies the change after an undo. */
  abstract redo(): string;

  /**
   * Captures the shape and, for a container, every descendant.
   * A move or a scale of a `<g>` is one undo unit, so the whole subtree must be
   * memento'd even though only leaves hold geometry.
   */
  protected captureStates(shape: Shape): readonly ShapeStateEntry[] {
    const targets = shape instanceof ContainerShape ? shape.selfAndDescendants() : [shape];
    return targets.map((target) => ({ shape: target, state: target.captureState() }));
  }

  protected restoreStates(entries: readonly ShapeStateEntry[]): void {
    for (const entry of entries) entry.shape.restoreState(entry.state);
  }
}
