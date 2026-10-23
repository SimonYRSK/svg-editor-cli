import { describe, expect, it } from 'vitest';
import { Session } from './support/Session.js';
import { OTHER_SVG } from './support/fixtures.js';

/** The two display formats of §5. */
describe('tree', () => {
  it('shows the whole document with inline geometry', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    session.run('read other.svg');
    expect(session.run('tree')).toEqual([
      'svg (400x300)',
      '├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff',
      '├── text#t1        (10,290) "imported"',
      '├── circle#c1      cx=50 cy=50 r=10',
      '├── g#g1',
      '│   ├── rect#r2    x=0 y=0 w=10 h=10',
      '│   └── circle#c2  cx=5 cy=5 r=2',
      '└── ellipse#e1     cx=1 cy=2 rx=3 ry=4',
    ]);
  });

  it('aligns the attribute column across the whole tree', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    session.run('read other.svg');
    const columns = session
      .run('tree')
      .slice(1)
      .map((line) => line.search(/(x=|cx=|\(|-{2})/))
      .filter((column) => column >= 0);
    expect(new Set(columns).size).toBe(1);
  });

  it('shows a single subtree, or a single shape', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    session.run('read other.svg');
    expect(session.run('tree g1')).toEqual([
      'g#g1',
      '├── rect#r2    x=0 y=0 w=10 h=10',
      '└── circle#c2  cx=5 cy=5 r=2',
    ]);
    expect(session.run('tree c2')).toEqual(['circle#c2  cx=5 cy=5 r=2']);
  });

  it('shows an empty canvas', () => {
    const session = new Session();
    session.run('init 100 50');
    expect(session.run('tree')).toEqual(['svg (100x50)']);
  });
});

describe('show', () => {
  it('prints the parent, the geometry and then one style attribute per line', () => {
    const session = new Session();
    session.runAll(['init', 'create g markers', 'create circle c1 100 100 20 red in markers']);
    expect(session.run('show c1')).toEqual([
      'circle#c1  parent=g#markers',
      '  cx=100 cy=100 r=20',
      '  fill=red',
    ]);
  });

  it('prints the children count for a container', () => {
    const session = new Session();
    session.runAll(['init', 'create g g1', 'create rect r1 0 0 1 1 in g1']);
    expect(session.run('show g1')).toEqual(['g#g1  parent=svg', '  children=1']);
  });
});

describe('help and canvas', () => {
  it('lists every registered command with its syntax', () => {
    const session = new Session();
    const lines = session.run('help');
    expect(lines[0]).toBe('commands:');
    for (const name of ['init', 'read', 'save', 'canvas', 'create', 'delete', 'move', 'scale', 'set',
      'group', 'ungroup', 'addto', 'front', 'back', 'undo', 'redo', 'tree', 'show', 'help', 'exit']) {
      expect(lines.some((line) => line.trim().startsWith(`${name} `) || line.trim() === name)).toBe(true);
    }
  });

  it('reports the canvas size after a resize', () => {
    const session = new Session();
    session.run('init 800 600');
    expect(session.run('canvas')).toEqual(['canvas 800x600']);
    expect(session.run('canvas 1024 768')).toEqual(['canvas resized to 1024x768']);
    expect(session.run('canvas')).toEqual(['canvas 1024x768']);
  });
});
