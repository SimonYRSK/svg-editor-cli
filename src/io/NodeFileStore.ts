import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { FileReadError } from '../model/errors/FileReadError.js';
import { FileWriteError } from '../model/errors/FileWriteError.js';
import type { FileStore } from './FileStore.js';

/** `FileStore` backed by the real file system (the only class that imports `node:fs`). */
export class NodeFileStore implements FileStore {
  readText(path: string): string {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      throw new FileReadError(path);
    }
  }

  writeText(path: string, content: string): void {
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, 'utf8');
    } catch {
      throw new FileWriteError(path);
    }
  }
}
