import { FileReadError } from '../../src/model/errors/FileReadError.js';
import { FileWriteError } from '../../src/model/errors/FileWriteError.js';
import type { FileStore } from '../../src/io/FileStore.js';

/** In-memory `FileStore`: tests never touch the real file system. */
export class MemoryFileStore implements FileStore {
  private readonly files = new Map<string, string>();
  private readonly unwritable = new Set<string>();

  readText(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) throw new FileReadError(path);
    return content;
  }

  writeText(path: string, content: string): void {
    if (this.unwritable.has(path)) throw new FileWriteError(path);
    this.files.set(path, content);
  }

  has(path: string): boolean {
    return this.files.has(path);
  }

  /** Makes `writeText` fail for this path (to exercise `cannot write file`). */
  forbid(path: string): void {
    this.unwritable.add(path);
  }
}
