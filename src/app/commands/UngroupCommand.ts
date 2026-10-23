import { NotAContainerError } from '../../model/errors/NotAContainerError.js';
import { UngroupCompositeError } from '../../model/errors/UngroupCompositeError.js';
import { UngroupTopLevelError } from '../../model/errors/UngroupTopLevelError.js';
import { UsageError } from '../../model/errors/UsageError.js';
import { ContainerShape } from '../../model/shapes/ContainerShape.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';

/**
 * `ungroup <gid>` — dissolves a container, promoting its children into the
 * parent container at the position the group occupied.
 *
 * Two refusals are part of the contract: a composite shape cannot be ungrouped
 * (its parts belong to its provider), and a container that is a direct child of
 * `<svg>` has no parent container to promote into. The composite refusal is
 * asked polymorphically (`supportsUngroup`), so a plugin type gets it for free.
 */
export class UngroupCommand extends EditCommand {
  readonly name = 'ungroup';
  readonly syntax = 'ungroup <gid>';
  readonly summary = 'dissolve a container, promoting its children';

  private group: ContainerShape | null = null;
  private parent: ContainerShape | null = null;
  private index = 0;
  private promoted: Shape[] = [];

  execute(args: readonly string[], editor: Editor): string {
    if (args.length !== 1) throw new UsageError(this.syntax);
    const document = editor.requireDocument();
    const shape = document.require(args[0]);
    if (!(shape instanceof ContainerShape)) throw new NotAContainerError(args[0]);
    if (!shape.supportsUngroup) throw new UngroupCompositeError(shape.id);
    if (document.isTopLevel(shape)) throw new UngroupTopLevelError(shape.id);

    const parent = shape.parent;
    if (parent === null) throw new UngroupTopLevelError(shape.id);
    const index = parent.indexOf(shape);
    const children = [...shape.children];

    parent.removeChild(shape);
    children.forEach((child, offset) => {
      shape.removeChild(child);
      parent.insertChild(index + offset, child);
    });

    this.group = shape;
    this.parent = parent;
    this.index = index;
    this.promoted = children;
    return `${shape.reference} ungrouped (${children.length} children promoted)`;
  }

  undo(): string {
    const group = this.requireGroup();
    const parent = this.requireParent();
    for (const child of this.promoted) parent.removeChild(child);
    parent.insertChild(this.index, group);
    for (const child of this.promoted) group.appendChild(child);
    return `${group.reference} regrouped (${this.promoted.length} children)`;
  }

  redo(): string {
    return this.executeAgain();
  }

  private executeAgain(): string {
    const group = this.requireGroup();
    const parent = this.requireParent();
    parent.removeChild(group);
    this.promoted.forEach((child, offset) => {
      group.removeChild(child);
      parent.insertChild(this.index + offset, child);
    });
    return `${group.reference} ungrouped (${this.promoted.length} children promoted)`;
  }

  private requireGroup(): ContainerShape {
    if (this.group === null) throw new Error('ungroup command has not run yet');
    return this.group;
  }

  private requireParent(): ContainerShape {
    if (this.parent === null) throw new Error('ungroup command has not run yet');
    return this.parent;
  }
}
