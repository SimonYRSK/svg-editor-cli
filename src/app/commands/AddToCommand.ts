import { DescendantMoveError } from '../../model/errors/DescendantMoveError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import type { Placement } from '../../model/document/Placement.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/** `addto <gid> <id>` — moves an existing shape into a container (as last child). */
export class AddToCommand extends EditCommand {
  readonly name = 'addto';
  readonly syntax = 'addto <gid> <id>';
  readonly summary = 'move an existing shape into a container';

  private container: ContainerShape | null = null;
  private shape: Shape | null = null;
  private origin: Placement | null = null;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 2) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const container = document.requireContainer(args[0]);
    const shape = document.require(args[1]);
    if (shape === container) throw new DescendantMoveError(args[1]);
    if (shape instanceof ContainerShape && shape.isAncestorOf(container)) {
      throw new DescendantMoveError(args[1]);
    }

    const origin = document.remove(shape);
    container.appendChild(shape);

    this.container = container;
    this.shape = shape;
    this.origin = origin;
    return `${shape.reference} added to ${container.reference}`;
  }

  undo(): string {
    const container = this.requireContainer();
    const shape = this.requireShape();
    const origin = this.requireOrigin();
    container.removeChild(shape);
    origin.parent.insertChild(origin.index, shape);
    return `${shape.reference} removed from ${container.reference}, returned to ${origin.parent.reference}`;
  }

  redo(): string {
    const container = this.requireContainer();
    const shape = this.requireShape();
    this.requireOrigin().parent.removeChild(shape);
    container.appendChild(shape);
    return `${shape.reference} added to ${container.reference}`;
  }

  private requireContainer(): ContainerShape {
    if (this.container === null) throw new Error('addto command has not run yet');
    return this.container;
  }

  private requireShape(): Shape {
    if (this.shape === null) throw new Error('addto command has not run yet');
    return this.shape;
  }

  private requireOrigin(): Placement {
    if (this.origin === null) throw new Error('addto command has not run yet');
    return this.origin;
  }
}
