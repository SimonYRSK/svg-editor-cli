import type { Document } from '../model/document/Document.js';
import { NoDocumentError } from '../model/errors/NoDocumentError.js';
import type { ShapeTypeRegistry } from '../model/shapes/ShapeTypeRegistry.js';
import { History } from './History.js';

/**
 * The session state a command works against: the open document, the available
 * shape types and the undo history.
 *
 * Commands receive this object instead of reaching for globals, which keeps
 * them testable: a test builds an `Editor`, runs a command object directly, and
 * inspects the document.
 */
export class Editor {
  private currentDocument: Document | null = null;
  private readonly registry: ShapeTypeRegistry;
  private readonly undoHistory: History;

  constructor(shapeTypes: ShapeTypeRegistry, history: History = new History()) {
    this.registry = shapeTypes;
    this.undoHistory = history;
  }

  get document(): Document | null {
    return this.currentDocument;
  }

  /** @throws NoDocumentError */
  requireDocument(): Document {
    if (this.currentDocument === null) throw new NoDocumentError();
    return this.currentDocument;
  }

  get shapeTypes(): ShapeTypeRegistry {
    return this.registry;
  }

  get history(): History {
    return this.undoHistory;
  }

  /** Installs a new document (`init` / `read`) and invalidates the history. */
  open(document: Document, sourcePath: string | null = null): void {
    if (sourcePath !== null) document.setSourcePath(sourcePath);
    this.currentDocument = document;
    this.history.lockAfterIo();
  }
}
