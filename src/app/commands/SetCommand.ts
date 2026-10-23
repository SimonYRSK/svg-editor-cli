import { UsageError } from '../../model/errors/UsageError.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import type { NamedValue } from '../../model/shapes/NamedValue.js';
import type { Shape } from '../../model/shapes/Shape.js';
import type { ShapeState } from '../../model/shapes/ShapeState.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `set <id> <attr> <value>` — changes one whitelisted attribute.
 *
 * The whitelist lives on the shape (`Shape.setAttribute` + the per-type
 * geometry hook), so this command stays a thin shell: validate the arguments,
 * take a memento, delegate the change, report it. Because the memento is taken
 * before the delegate runs, an `unknown attribute` error leaves no trace.
 */
export class SetCommand extends EditCommand {
  readonly name = 'set';
  readonly syntax = 'set <id> <attr> <value>';
  readonly summary = 'set fill / stroke / stroke-width / geometry / text';

  private target: Shape | null = null;
  private before: ShapeState | null = null;
  private attributeName = '';
  private applied: NamedValue | null = null;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 3) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const shape = document.require(args[0]);
    const attributeName = args[1];

    const before = shape.captureState();
    const applied = shape.setAttribute(attributeName, args[2]);

    this.target = shape;
    this.before = before;
    this.attributeName = attributeName;
    this.applied = applied;
    return this.describe(shape, applied);
  }

  undo(): string {
    const shape = this.requireTarget();
    const before = this.requireBefore();
    shape.restoreState(before);
    const previous = this.previousValueIn(before, this.attributeName);
    return this.describe(shape, previous);
  }

  redo(): string {
    const shape = this.requireTarget();
    const applied = this.applied;
    if (applied === null) throw new Error('set command has not run yet');
    shape.setAttribute(this.attributeName, applied[1]);
    return this.describe(shape, applied);
  }

  private describe(shape: Shape, pair: NamedValue | null): string {
    if (pair === null) return `${shape.reference} updated: ${this.attributeName} cleared`;
    const [name, value] = pair;
    const rendered = name === 'text' ? `${name}=${JSON.stringify(value)}` : `${name}=${value}`;
    return `${shape.reference} updated: ${rendered}`;
  }

  /** The value the attribute had before the command ran, read from the memento. */
  private previousValueIn(state: ShapeState, name: string): NamedValue | null {
    const geometry = state.geometry.find(([attribute]) => attribute === name);
    if (geometry !== undefined) return geometry;
    if (name === 'fill') return state.fill === null ? null : ['fill', state.fill];
    if (name === 'stroke') return state.stroke === null ? null : ['stroke', state.stroke];
    if (name === 'stroke-width') {
      return state.strokeWidth === null ? null : ['stroke-width', NumberText.format(state.strokeWidth)];
    }
    if (name === 'text') return state.content === null ? null : ['text', state.content];
    return null;
  }

  private requireTarget(): Shape {
    if (this.target === null) throw new Error('set command has not run yet');
    return this.target;
  }

  private requireBefore(): ShapeState {
    if (this.before === null) throw new Error('set command has not run yet');
    return this.before;
  }
}
