import { GroupCycleError } from '../../model/errors/GroupCycleError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import { NounCount } from '../../model/text/NounCount.js';
import type { Placement } from '../../model/document/Placement.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `group <newGid> <id1> <id2>…`: collects existing shapes into a new container.
 *
 * The new container takes the place of the first listed shape, so the visual
 * stacking order is preserved. Every listed shape keeps its order inside the
 * group, and the whole operation is a single undo unit.
 */
export class GroupCommand extends EditCommand {
  readonly name = 'group';
  readonly syntax = 'group <newGid> <id1> <id2>…';
  readonly summary = 'collect existing shapes into a new container';

  private group: ContainerShape | null = null;
  private placements: readonly Placement[] = [];
  private collected: readonly Shape[] = [];
  private insertion: { parent: ContainerShape; index: number } | null = null;

  execute(args: readonly string[], editor: Editor): string {
    if (args.length < 2) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const newId = args[0];
    const ids = args.slice(1).filter((id, position, all) => all.indexOf(id) === position);

    document.assertIdAvailable(newId);
    const shapes = ids.map((id) => document.require(id));
    this.assertNoCycle(shapes);
    const group = editor.shapeTypes.resolve('g').createFromParams(newId, []);
    if (!(group instanceof ContainerShape)) throw new Error('the g provider must build a container');

    const placements = shapes.map((shape) => document.placementOf(shape));
    const parent = placements[0].parent;
    const anchor = placements.find((placement) => placement.parent === parent);
    if (anchor === undefined) throw new Error('grouped shapes share no parent');
    const selected = new Set(shapes);
    const index = parent.children.filter(
      (child, childIndex) => childIndex < anchor.index && !selected.has(child),
    ).length;

    for (const shape of shapes) document.remove(shape);
    parent.insertChild(index, group);
    for (const shape of shapes) group.appendChild(shape);

    this.group = group;
    this.placements = placements;
    this.collected = shapes;
    this.insertion = { parent, index };
    return `${group.reference} created with ${NounCount.of(shapes.length, 'child', 'children')}`;
  }

  undo(): string {
    const group = this.requireGroup();
    const insertion = this.insertion;
    if (insertion === null) throw new Error('group command has not run yet');
    insertion.parent.removeChild(group);
    const restored = this.collected
      .map((shape, position) => ({ shape, placement: this.placements[position] }))
      .sort((left, right) => left.placement.index - right.placement.index);
    for (const entry of restored) {
      group.removeChild(entry.shape);
      entry.placement.parent.insertChild(entry.placement.index, entry.shape);
    }
    return `${group.reference} dissolved (${NounCount.of(this.collected.length, 'child', 'children')} restored)`;
  }

  redo(): string {
    const group = this.requireGroup();
    const insertion = this.insertion;
    if (insertion === null) throw new Error('group command has not run yet');
    for (const shape of this.collected) insertion.parent.removeChild(shape);
    insertion.parent.insertChild(insertion.index, group);
    for (const shape of this.collected) group.appendChild(shape);
    return `${group.reference} created with ${NounCount.of(this.collected.length, 'child', 'children')}`;
  }

  /** A container and one of its own descendants cannot end up as siblings. */
  private assertNoCycle(shapes: readonly Shape[]): void {
    for (const shape of shapes) {
      if (!(shape instanceof ContainerShape)) continue;
      const ownsAnother = shapes.some((other) => other !== shape && shape.isAncestorOf(other));
      if (ownsAnother) throw new GroupCycleError(shape.id);
    }
  }

  private requireGroup(): ContainerShape {
    if (this.group === null) throw new Error('group command has not run yet');
    return this.group;
  }
}
