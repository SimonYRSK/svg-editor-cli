import { NothingToRedoError } from '../model/errors/NothingToRedoError.js';
import { NothingToUndoError } from '../model/errors/NothingToUndoError.js';
import { RedoNotAllowedError } from '../model/errors/RedoNotAllowedError.js';
import { UndoNotAllowedError } from '../model/errors/UndoNotAllowedError.js';
import type { EditCommand } from './EditCommand.js';

/**
 * The undo / redo stacks.
 *
 * Rules taken from the assignment:
 * - one edit command = one undo unit (the command object is stored as a whole);
 * - a new edit after an undo clears the redo stack;
 * - a document level command (`init`, `read`, `save`, `canvas <w> <h>`) locks
 *   undo/redo until the next edit command runs, because the document those
 *   commands referred to no longer exists.
 */
export class History {
  private readonly undoStack: EditCommand[] = [];
  private readonly redoStack: EditCommand[] = [];
  private lockedByIo = false;

  get undoDepth(): number {
    return this.undoStack.length;
  }

  get redoDepth(): number {
    return this.redoStack.length;
  }

  get ioLocked(): boolean {
    return this.lockedByIo;
  }

  record(command: EditCommand): void {
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.lockedByIo = false;
  }

  /** Called by document level commands: forgets the stacks and locks undo/redo. */
  lockAfterIo(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.lockedByIo = true;
  }

  /** @throws UndoNotAllowedError | NothingToUndoError */
  undo(): string {
    if (this.lockedByIo) throw new UndoNotAllowedError();
    const command = this.undoStack.pop();
    if (command === undefined) throw new NothingToUndoError();
    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  /** @throws RedoNotAllowedError | NothingToRedoError */
  redo(): string {
    if (this.lockedByIo) throw new RedoNotAllowedError();
    const command = this.redoStack.pop();
    if (command === undefined) throw new NothingToRedoError();
    const message = command.redo();
    this.undoStack.push(command);
    return message;
  }
}
