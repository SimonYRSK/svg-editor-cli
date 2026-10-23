import { ScaleFactorError } from '../../model/errors/ScaleFactorError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import { NounCount } from '../../model/text/NounCount.js';
import { NumberText } from '../../model/geometry/NumberText.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand, type ShapeStateEntry } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `scale <id> <factor>`: multiplies every geometric attribute by `factor`.
 *
 * Note that this is *not* a `transform="scale(...)"`: coordinates really change,
 * so the saved SVG stays readable and the tree keeps showing real numbers. On a
 * container the factor recurses into every descendant.
 */
export class ScaleCommand extends EditCommand {
  readonly name = 'scale';
  readonly syntax = 'scale <id> <factor>';
  readonly summary = 'multiply all geometry of a shape by a positive factor';

  private target: Shape | null = null;
  private states: readonly ShapeStateEntry[] = [];
  private factorValue = 1;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 2) throw new UsageError(this.syntax);
    const factor = NumberText.parse(args[1]);
    if (factor <= 0) throw new ScaleFactorError();
    const document = editor.requireDocument();
    const shape = document.require(args[0]);

    this.target = shape;
    this.factorValue = factor;
    this.states = this.captureStates(shape);
    shape.scaleBy(factor);
    return this.describe(shape, factor, false);
  }

  undo(): string {
    this.restoreStates(this.states);
    return this.describe(this.requireTarget(), this.factorValue, true);
  }

  redo(): string {
    const shape = this.requireTarget();
    shape.scaleBy(this.factorValue);
    return this.describe(shape, this.factorValue, false);
  }

  private describe(shape: Shape, factor: number, reverted: boolean): string {
    const direction = reverted ? 'back ' : '';
    const scale = NumberText.format(factor);
    if (shape instanceof ContainerShape) {
      return `${shape.reference} scaled ${direction}by ${scale} (${NounCount.of(this.states.length, 'shape')})`;
    }
    return `${shape.reference} scaled ${direction}by ${scale} to ${shape.describeGeometry()}`;
  }

  private requireTarget(): Shape {
    if (this.target === null) throw new Error('scale command has not run yet');
    return this.target;
  }
}
