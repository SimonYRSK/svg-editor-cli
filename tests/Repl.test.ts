import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { CompositionRoot } from '../src/CompositionRoot.js';
import { MemoryFileStore } from './support/MemoryFileStore.js';

/** The terminal loop itself: banner, prompt, comment lines and `exit`. */
describe('REPL', () => {
  it('prints the banner, one prompt per line and stops on exit', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));

    const repl = new CompositionRoot(new MemoryFileStore()).createRepl(input, output);
    const finished = repl.run();
    input.write('# a comment is ignored\n');
    input.write('init 400 300\n');
    input.write('canvas\n');
    input.write('create rect r1 0 0 10 10\n');
    input.write('tree\n');
    input.write('exit\n');
    await finished;

    const transcript = chunks.join('');
    expect(transcript).toContain("svg-editor 0.1 — type 'help' for commands");
    expect(transcript).toContain('canvas 400x300 created');
    expect(transcript).toContain('canvas 400x300\n');
    expect(transcript).toContain('rect#r1 created');
    expect(transcript).toContain('└── rect#r1  x=0 y=0 w=10 h=10');
    expect(transcript).not.toContain('a comment is ignored');
  });

  it('leaves on end of input as well', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const repl = new CompositionRoot(new MemoryFileStore()).createRepl(input, output);
    const finished = repl.run();
    input.end();
    await expect(finished).resolves.toBeUndefined();
  });
});
