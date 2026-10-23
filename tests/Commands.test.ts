import { describe, expect, it } from 'vitest';
import { Session } from './support/Session.js';

/** Behaviour of the edit commands, including the Composite contract. */
describe('structural commands', () => {
  it('adds an existing shape to a container and undoes it', () => {
    const session = new Session();
    session.runAll(['init', 'create g g1', 'create rect r1 10 10 20 20']);
    expect(session.run('addto g1 r1')).toEqual(['rect#r1 added to g#g1']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '└── g#g1',
      '    └── rect#r1  x=10 y=10 w=20 h=20',
    ]);
    expect(session.run('undo')).toEqual(['rect#r1 removed from g#g1, returned to svg']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '├── g#g1',
      '└── rect#r1  x=10 y=10 w=20 h=20',
    ]);
  });

  it('promotes children on ungroup and puts them back on undo', () => {
    const session = new Session();
    session.runAll([
      'init',
      'create g scene',
      'create rect a 0 0 10 10 in scene',
      'create circle b 5 5 2 in scene',
      'create rect c 9 9 9 9 in scene',
      'group gx a b',
    ]);
    expect(session.run('ungroup gx')).toEqual(['g#gx ungrouped (2 children promoted)']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '└── g#scene',
      '    ├── rect#a    x=0 y=0 w=10 h=10',
      '    ├── circle#b  cx=5 cy=5 r=2',
      '    └── rect#c    x=9 y=9 w=9 h=9',
    ]);
    expect(session.run('undo')).toEqual(['g#gx regrouped (2 children)']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '└── g#scene',
      '    ├── g#gx',
      '    │   ├── rect#a    x=0 y=0 w=10 h=10',
      '    │   └── circle#b  cx=5 cy=5 r=2',
      '    └── rect#c        x=9 y=9 w=9 h=9',
    ]);
  });

  it('gives the new group the position of the first collected shape', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10', 'create rect b 0 0 10 10', 'create rect c 0 0 10 10']);
    expect(session.run('group gx b')).toEqual(['g#gx created with 1 child']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '├── rect#a      x=0 y=0 w=10 h=10',
      '├── g#gx',
      '│   └── rect#b  x=0 y=0 w=10 h=10',
      '└── rect#c      x=0 y=0 w=10 h=10',
    ]);
  });

  it('reorders siblings with front and back, and undoes the reorder', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 1 1', 'create rect b 0 0 1 1', 'create rect c 0 0 1 1']);
    expect(session.run('front a')).toEqual(['rect#a moved to front']);
    expect(session.run('tree').slice(1)).toEqual([
      '├── rect#b  x=0 y=0 w=1 h=1',
      '├── rect#c  x=0 y=0 w=1 h=1',
      '└── rect#a  x=0 y=0 w=1 h=1',
    ]);
    expect(session.run('undo')).toEqual(['rect#a moved back to position 0']);
    expect(session.run('back a')).toEqual(['rect#a moved to back']);
    expect(session.run('tree').slice(1)[0]).toBe('├── rect#a  x=0 y=0 w=1 h=1');
  });

  it('deletes a whole container and restores the subtree on undo', () => {
    const session = new Session();
    session.runAll([
      'init',
      'create g g1',
      'create rect r1 0 0 10 10 in g1',
      'create text t1 1 1 "x" in g1',
    ]);
    expect(session.run('delete g1')).toEqual(['g#g1 deleted']);
    expect(session.run('tree')).toEqual(['svg (800x600)']);
    expect(session.run('undo')).toEqual(['g#g1 restored into svg']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '└── g#g1',
      '    ├── rect#r1  x=0 y=0 w=10 h=10',
      '    └── text#t1  (1,1) "x"',
    ]);
  });

  it('refuses to ungroup a leaf shape', () => {
    const session = new Session();
    session.runAll(['init', 'create rect r1 0 0 1 1']);
    expect(session.run('ungroup r1')).toEqual(['error: not a container: r1']);
  });
});

describe('geometry commands (Composite semantics)', () => {
  it('moves and scales a container recursively, and undoes both', () => {
    const session = new Session();
    session.runAll([
      'init',
      'create g g1',
      'create rect r1 10 10 20 10 in g1',
      'create circle c1 30 30 5 in g1',
    ]);
    expect(session.run('move g1 5 5')).toEqual(['g#g1 moved by (5,5)']);
    expect(session.run('show r1')).toEqual(['rect#r1  parent=g#g1', '  x=15 y=15 w=20 h=10']);
    expect(session.run('scale g1 2')).toEqual(['g#g1 scaled by 2 (3 shapes)']);
    expect(session.run('show r1')).toEqual(['rect#r1  parent=g#g1', '  x=30 y=30 w=40 h=20']);
    expect(session.run('show c1')).toEqual(['circle#c1  parent=g#g1', '  cx=70 cy=70 r=10']);
    expect(session.run('undo')).toEqual(['g#g1 scaled back by 2 (3 shapes)']);
    expect(session.run('show r1')[1]).toBe('  x=15 y=15 w=20 h=10');
  });

  it('sets whitelisted attributes and restores the previous value on undo', () => {
    const session = new Session();
    session.runAll(['init', 'create rect r1 10 10 20 20 #eee']);
    expect(session.run('set r1 width 50')).toEqual(['rect#r1 updated: width=50']);
    expect(session.run('undo')).toEqual(['rect#r1 updated: width=20']);
    expect(session.run('set r1 stroke-width 3')).toEqual(['rect#r1 updated: stroke-width=3']);
    expect(session.run('show r1')).toEqual([
      'rect#r1  parent=svg',
      '  x=10 y=10 w=20 h=20',
      '  fill=#eee',
      '  stroke-width=3',
    ]);
    expect(session.run('undo')).toEqual(['rect#r1 updated: stroke-width cleared']);
  });

  it('scales a leaf and reports the resulting geometry', () => {
    const session = new Session();
    session.runAll(['init', 'create rect r1 10 20 30 40']);
    expect(session.run('scale r1 1.5')).toEqual(['rect#r1 scaled by 1.5 to x=15 y=30 w=45 h=60']);
  });

  it('edits text content through the `text` pseudo attribute', () => {
    const session = new Session();
    session.runAll(['init', 'create text t1 20 40 "a b"']);
    expect(session.run('set t1 text "a b c"')).toEqual(['text#t1 updated: text="a b c"']);
    expect(session.run('show t1')).toEqual(['text#t1  parent=svg', '  (20,40) "a b c"']);
    expect(session.run('undo')).toEqual(['text#t1 updated: text="a b"']);
  });
});
