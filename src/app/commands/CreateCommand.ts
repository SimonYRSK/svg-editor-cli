import { UsageError } from '../../model/errors/UsageError.js';
import type { Placement } from '../../model/document/Placement.js';
import type { Shape } from '../../model/shapes/Shape.js';
import { EditCommand } from '../EditCommand.js';
import type { Editor } from '../Editor.js';
import { CreateRequest } from './CreateRequest.js';

/**
 * `create <type> <id> [params…] [in <containerId>]`
 *
 * The command itself knows nothing about rects or circles: it resolves a
 * `ShapeTypeProvider` from the registry, asks it to build the shape, and asks
 * the document to insert it. That is what lets a plugin add `box` later without
 * touching this file.
 */
export class CreateCommand extends EditCommand {
  readonly name = 'create';
  readonly syntax = 'create <type> <id> [params…] [in <containerId>]';
  readonly summary = 'create a shape (rect, circle, ellipse, line, text, g)';

  private created: Shape | null = null;
  private placement: Placement | null = null;
  private createdMessage = '';

  execute(args: readonly string[], editor: Editor): string {
    const document = editor.requireDocument();
    const request = this.parseRequest(args);
    const provider = editor.shapeTypes.resolve(request.typeName);
    document.assertIdAvailable(request.id);
    const container =
      request.containerId === null ? document.root : document.requireContainer(request.containerId);
    const shape = provider.createFromParams(request.id, request.params);
    document.insert(shape, container);

    this.created = shape;
    this.placement = { parent: container, index: container.indexOf(shape) };
    this.createdMessage =
      container === document.root
        ? `${shape.reference} created`
        : `${shape.reference} created in ${container.reference}`;
    return this.createdMessage;
  }

  undo(): string {
    const shape = this.requireCreated();
    const placement = this.requirePlacement();
    placement.parent.removeChild(shape);
    return `${shape.reference} removed`;
  }

  redo(): string {
    const shape = this.requireCreated();
    const placement = this.requirePlacement();
    placement.parent.insertChild(placement.index, shape);
    return this.createdMessage;
  }

  /** Splits `<type> <id> [params…] [in <container>]` (the `in` clause is a suffix). */
  private parseRequest(args: readonly string[]): CreateRequest {
    if (args.length < 2) throw new UsageError(this.syntax);
    const typeName = args[0];
    const id = args[1];
    let rest = args.slice(2);
    let containerId: string | null = null;
    if (rest.length >= 2 && rest[rest.length - 2] === 'in') {
      containerId = rest[rest.length - 1];
      rest = rest.slice(0, rest.length - 2);
    }
    if (id.length === 0) throw new UsageError(this.syntax);
    return new CreateRequest(typeName, id, rest, containerId);
  }

  private requireCreated(): Shape {
    if (this.created === null) throw new Error('create command has not run yet');
    return this.created;
  }

  private requirePlacement(): Placement {
    if (this.placement === null) throw new Error('create command has not run yet');
    return this.placement;
  }
}
