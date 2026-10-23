import { UsageError } from '../../model/errors/UsageError.js';
import type { Placement } from '../../model/document/Placement.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/** `delete <id>` — removes a shape, or a container with its whole subtree. */
export class DeleteCommand extends EditCommand {
  readonly name = 'delete';
  readonly syntax = 'delete <id>';
  readonly summary = 'delete a shape (a container takes its descendants with it)';

  private removed: Shape | null = null;
  private placement: Placement | null = null;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const shape = document.require(args[0]);
    this.removed = shape;
    this.placement = document.remove(shape);
    return `${shape.reference} deleted`;
  }

  undo(): string {
    const shape = this.requireRemoved();
    const placement = this.requirePlacement();
    placement.parent.insertChild(placement.index, shape);
    return `${shape.reference} restored into ${placement.parent.reference}`;
  }

  redo(): string {
    const shape = this.requireRemoved();
    this.requirePlacement().parent.removeChild(shape);
    return `${shape.reference} deleted`;
  }

  private requireRemoved(): Shape {
    if (this.removed === null) throw new Error('delete command has not run yet');
    return this.removed;
  }

  private requirePlacement(): Placement {
    if (this.placement === null) throw new Error('delete command has not run yet');
    return this.placement;
  }
}
