import type { Document } from '../model/document/Document.js';

/** Outcome of reading an SVG file: the document plus the warnings it produced. */
export class ReadResult {
  readonly document: Document;
  readonly warnings: readonly string[];

  constructor(document: Document, warnings: readonly string[]) {
    this.document = document;
    this.warnings = warnings;
  }
}
