import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Executable architecture rules.
 *
 * The assignment asks for an explicit dependency direction, so the direction is
 * a test instead of a paragraph: a violating import fails `npm test`.
 */

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

/** Allowed dependencies of each layer, by name. `root` may use everything. */
const ALLOWED: Readonly<Record<string, readonly string[]>> = {
  model: ['model'],
  io: ['model', 'io'],
  app: ['model', 'io', 'app'],
  presentation: ['model', 'app', 'presentation'],
  root: ['model', 'io', 'app', 'presentation', 'root'],
};

/** Removes block and line comments so prose about a construct is not flagged as the construct. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

/** `model`, `io`, `app`, `presentation`, or `root` for the composition files. */
function layerOf(path: string): string {
  const parts = relative(SRC, path).split('/');
  if (parts.length === 1) return 'root';
  return parts[0];
}

function importedSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:from|import)\s+'([^']+)'/g;
  let match = pattern.exec(source);
  while (match !== null) {
    specifiers.push(match[1]);
    match = pattern.exec(source);
  }
  return specifiers;
}

function resolveSpecifier(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  return resolve(dirname(from), specifier.replace(/\.js$/, '.ts'));
}

describe('dependency direction', () => {
  const files = sourceFiles(SRC);

  it('finds the sources it is supposed to check', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it.each(files.map((path) => [relative(SRC, path), path] as const))(
    '%s only imports allowed layers',
    (_name, path) => {
      const layer = layerOf(path);
      for (const specifier of importedSpecifiers(readFileSync(path, 'utf8'))) {
        const resolved = resolveSpecifier(path, specifier);
        if (resolved === null) continue;
        const target = layerOf(resolved);
        expect(ALLOWED[layer], `${layer} may not depend on ${target}`).toContain(target);
      }
    },
  );

  it('keeps `node:fs` inside the io layer', () => {
    for (const path of files) {
      if (!readFileSync(path, 'utf8').includes('node:fs')) continue;
      expect(layerOf(path)).toBe('io');
    }
  });

  it('never dispatches with a switch statement', () => {
    const offenders = files.filter((path) =>
      /switch\s*\(/.test(withoutComments(readFileSync(path, 'utf8'))),
    );
    expect(offenders.map((path) => relative(SRC, path))).toEqual([]);
  });

  it('model has no dependency on the outer layers', () => {
    const modelFiles = files.filter((path) => layerOf(path) === 'model');
    for (const path of modelFiles) {
      for (const specifier of importedSpecifiers(readFileSync(path, 'utf8'))) {
        const resolved = resolveSpecifier(path, specifier);
        if (resolved === null) continue;
        expect(layerOf(resolved), `${relative(SRC, path)} imports ${specifier}`).toBe('model');
      }
    }
  });
});
