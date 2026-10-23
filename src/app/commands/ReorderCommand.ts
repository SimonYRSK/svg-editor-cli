import { UsageError } from '../../model/errors/UsageError.js';
import type { Placement } from '../../model/document/Placement.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `front <id>` / `back <id>` — moves a shape to the top or bottom of its own
 * sibling list (z-order). Both words are instances of this class with a
 * different `mode`, which keeps the stacking rule in one place.
 */
export class ReorderCommand extends EditCommand {
  readonly name: string;
  readonly syntax: string;
  readonly summary: string;

  private readonly mode: 'front' | 'back';
  private shape: Shape | null = null;
  private origin: Placement | null = null;

  constructor(mode: 'front' | 'back') {
    super();
    this.mode = mode;
    this.name = mode;
    this.syntax = `${mode} <id>`;
    this.summary = mode === 'front' ? 'raise a shape to the front of its siblings' : 'send a shape to the back';
  }

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const shape = document.require(args[0]);
    const origin = document.placementOf(shape);
    origin.parent.removeChild(shape);
    origin.parent.insertChild(this.targetIndex(origin), shape);

    this.shape = shape;
    this.origin = origin;
    return `${shape.reference} moved to ${this.mode}`;
  }

  undo(): string {
    const shape = this.requireShape();
    const origin = this.requireOrigin();
    origin.parent.removeChild(shape);
    origin.parent.insertChild(origin.index, shape);
    return `${shape.reference} moved back to position ${origin.index}`;
  }

  redo(): string {
    const shape = this.requireShape();
    const origin = this.requireOrigin();
    origin.parent.removeChild(shape);
    origin.parent.insertChild(this.targetIndex(origin), shape);
    return `${shape.reference} moved to ${this.mode}`;
  }

  private targetIndex(origin: Placement): number {
    return this.mode === 'front' ? origin.parent.childCount : 0;
  }

  private requireShape(): Shape {
    if (this.shape === null) throw new Error('reorder command has not run yet');
    return this.shape;
  }

  private requireOrigin(): Placement {
    if (this.origin === null) throw new Error('reorder command has not run yet');
    return this.origin;
  }
}
