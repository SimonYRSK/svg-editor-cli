import { describe, expect, it } from 'vitest';
import { Session } from './support/Session.js';
import { OTHER_SVG } from './support/fixtures.js';

/** Every row of the assignment's error table (§4.2), asserted verbatim. */
describe('error messages of §4.2', () => {
  it('refuses any command before a document exists', () => {
    expect(new Session().run('tree')).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(new Session().run('create rect r1 0 0 10 10')).toEqual([
      "error: no document. use 'init' or 'read' first",
    ]);
  });

  it('reports an id that is already taken', () => {
    const session = new Session();
    session.run('init');
    session.run('create rect r1 0 0 10 10');
    expect(session.run('create circle r1 0 0 5')).toEqual(['error: id already exists: r1']);
  });

  it('reports an unknown shape id', () => {
    const session = new Session();
    session.run('init');
    expect(session.run('move r9 1 1')).toEqual(['error: no such shape: r9']);
    expect(session.run('delete r9')).toEqual(['error: no such shape: r9']);
    expect(session.run('show r9')).toEqual(['error: no such shape: r9']);
  });

  it('reports a missing and a non-container `in` target', () => {
    const session = new Session();
    session.run('init');
    session.run('create rect bg 0 0 10 10');
    expect(session.run('create rect r2 0 0 10 10 in node9')).toEqual([
      'error: no such container: node9',
    ]);
    expect(session.run('create rect r2 0 0 10 10 in bg')).toEqual(['error: not a container: bg']);
  });

  it('reports an unregistered shape type (the phase-2 `box` is not loaded)', () => {
    const session = new Session();
    session.run('init');
    expect(session.run('create box n1 120 100 160 60 "开始"')).toEqual([
      'error: unknown shape type: box (is the plugin loaded?)',
    ]);
  });

  it('refuses to group a container with its own descendant', () => {
    const session = new Session();
    session.run('init');
    session.run('create g g1');
    session.run('create rect r1 0 0 10 10 in g1');
    expect(session.run('group g2 r1 g1')).toEqual([
      'error: cannot group a container into its own descendant: g1',
    ]);
  });

  it('refuses to ungroup a top-level container', () => {
    const session = new Session();
    session.run('init');
    session.run('create g scene');
    expect(session.run('ungroup scene')).toEqual([
      'error: cannot ungroup top-level container: scene',
    ]);
  });

  it('refuses a non-positive scale factor', () => {
    const session = new Session();
    session.run('init');
    session.run('create rect r1 10 10 20 20');
    expect(session.run('scale r1 0')).toEqual(['error: scale factor must be positive']);
    expect(session.run('scale r1 -2')).toEqual(['error: scale factor must be positive']);
  });

  it('reports unreadable and unwritable files', () => {
    const session = new Session({ 'a.svg': OTHER_SVG });
    session.run('init');
    expect(session.run('read missing.svg')).toEqual(['error: cannot read file: missing.svg']);
    session.files.forbid('locked.svg');
    expect(session.run('save locked.svg')).toEqual(['error: cannot write file: locked.svg']);
  });

  it('reports usage errors for wrong arity', () => {
    const session = new Session();
    session.run('init');
    expect(session.run('create rect r1 1 2')).toEqual([
      'error: usage: create rect <id> <x> <y> <w> <h> [fill]',
    ]);
    expect(session.run('move r1 1')).toEqual(['error: usage: move <id> <dx> <dy>']);
    expect(session.run('set r1')).toEqual(['error: usage: set <id> <attr> <value>']);
  });

  it('reports numbers that do not parse and attributes outside the whitelist', () => {
    const session = new Session();
    session.run('init');
    session.run('create rect r1 10 10 20 20');
    expect(session.run('move r1 abc 0')).toEqual(['error: invalid number: abc']);
    expect(session.run('set r1 foo bar')).toEqual(['error: unknown attribute: foo']);
    expect(session.run('set r1 text hello')).toEqual(['error: unknown attribute: text']);
    expect(session.run('set r1 width -5')).toEqual([
      'error: invalid measure: -5 (must be a non-negative number)',
    ]);
  });

  it('reports empty history and unknown commands', () => {
    const session = new Session();
    session.runAll(['init', 'create rect r1 0 0 1 1']);
    session.run('undo');
    expect(session.run('undo')).toEqual(['error: nothing to undo']);
    expect(session.run('redo')).toEqual(['rect#r1 created']);
    expect(session.run('redo')).toEqual(['error: nothing to redo']);
    expect(session.run('fly away')).toEqual(["error: unknown command: fly (type 'help')"]);
  });

  it('locks undo after init, because a document command invalidates history', () => {
    const session = new Session();
    session.run('init');
    expect(session.run('undo')).toEqual(['error: undo not allowed after io command']);
  });

  it('refuses to move a container into its own descendant', () => {
    const session = new Session();
    session.run('init');
    session.run('create g g1');
    session.run('create g g2 in g1');
    expect(session.run('addto g2 g1')).toEqual([
      'error: cannot move a container into its own descendant: g1',
    ]);
  });
});
