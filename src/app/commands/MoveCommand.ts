import { UsageError } from '../../model/errors/UsageError.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand, type ShapeStateEntry } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `move <id> <dx> <dy>` — incremental translation.
 *
 * On a container the base class recursion moves every descendant, which is the
 * Composite behaviour the assignment asks for: the command does not know
 * whether the id names a group or a leaf.
 */
export class MoveCommand extends EditCommand {
  readonly name = 'move';
  readonly syntax = 'move <id> <dx> <dy>';
  readonly summary = 'translate a shape by (dx,dy); a container moves as a whole';

  private target: Shape | null = null;
  private states: readonly ShapeStateEntry[] = [];
  private dx = 0;
  private dy = 0;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 3) throw new UsageError(this.syntax);
    const dx = NumberText.parse(args[1]);
    const dy = NumberText.parse(args[2]);
    const document = editor.requireDocument();
    const shape = document.require(args[0]);

    this.target = shape;
    this.dx = dx;
    this.dy = dy;
    this.states = this.captureStates(shape);
    shape.translate(dx, dy);
    return this.describe(shape, dx, dy, false);
  }

  undo(): string {
    this.restoreStates(this.states);
    const shape = this.requireTarget();
    return this.describe(shape, -this.dx, -this.dy, true);
  }

  redo(): string {
    const shape = this.requireTarget();
    shape.translate(this.dx, this.dy);
    return this.describe(shape, this.dx, this.dy, false);
  }

  /** Leaves report their new anchor, containers report the delta they applied. */
  private describe(shape: Shape, dx: number, dy: number, reverted: boolean): string {
    const direction = reverted ? 'back ' : '';
    if (shape instanceof ContainerShape) {
      return `${shape.reference} moved ${direction}by (${NumberText.format(dx)},${NumberText.format(dy)})`;
    }
    return `${shape.reference} moved ${direction}to ${shape.anchor().toString()}`;
  }

  private requireTarget(): Shape {
    if (this.target === null) throw new Error('move command has not run yet');
    return this.target;
  }
}
