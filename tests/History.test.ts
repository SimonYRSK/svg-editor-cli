import { describe, expect, it } from 'vitest';
import { Session } from './support/Session.js';

/** The undo/redo rules of §4.3. */
describe('undo / redo granularity', () => {
  it('treats a multi-shape group as one undo unit', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 1 1', 'create circle b 0 0 1', 'create text t 0 0 "x"']);
    session.run('group gx a b t');
    expect(session.run('undo')).toEqual(['g#gx dissolved (3 children restored)']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '├── rect#a    x=0 y=0 w=1 h=1',
      '├── circle#b  cx=0 cy=0 r=1',
      '└── text#t    (0,0) "x"',
    ]);
  });

  it('clears the redo stack when a new edit happens after an undo', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10', 'move a 5 0']);
    expect(session.run('undo')).toEqual(['rect#a moved back to (0,0)']);
    expect(session.run('redo')).toEqual(['rect#a moved to (5,0)']);
    session.run('undo');
    session.run('move a 0 7');
    expect(session.run('redo')).toEqual(['error: nothing to redo']);
  });

  it('does not put display commands on the undo stack', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10']);
    session.runAll(['tree', 'show a', 'help', 'canvas']);
    expect(session.run('undo')).toEqual(['rect#a removed']);
    expect(session.run('tree')).toEqual(['svg (800x600)']);
  });

  it('locks undo and redo after a document command until the next edit', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10']);
    session.run('save a.svg');
    expect(session.run('undo')).toEqual(['error: undo not allowed after io command']);
    expect(session.run('redo')).toEqual(['error: redo not allowed after io command']);
    session.run('move a 1 1');
    expect(session.run('undo')).toEqual(['rect#a moved back to (0,0)']);
  });

  it('locks after a canvas resize and unlocks on the next edit', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10']);
    session.run('canvas 400 300');
    expect(session.run('undo')).toEqual(['error: undo not allowed after io command']);
    session.run('delete a');
    expect(session.run('undo')).toEqual(['rect#a restored into svg']);
  });

  it('keeps redo working for structural commands', () => {
    const session = new Session();
    session.runAll(['init', 'create rect a 0 0 10 10', 'create g gx']);
    session.run('addto gx a');
    expect(session.run('undo')).toEqual(['rect#a removed from g#gx, returned to svg']);
    expect(session.run('redo')).toEqual(['rect#a added to g#gx']);
    expect(session.run('tree')).toEqual([
      'svg (800x600)',
      '└── g#gx',
      '    └── rect#a  x=0 y=0 w=10 h=10',
    ]);
  });
});
