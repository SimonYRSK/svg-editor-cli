/**
 * The only port through which the editor touches the file system.
 *
 * Commands depend on this interface, the process wires a concrete store, and
 * tests substitute an in-memory implementation: which is why command tests
 * never need a temporary directory.
 */
export interface FileStore {
  /** @throws FileReadError when the path cannot be read */
  readText(path: string): string;

  /** @throws FileWriteError when the path cannot be written */
  writeText(path: string, content: string): void;
}
