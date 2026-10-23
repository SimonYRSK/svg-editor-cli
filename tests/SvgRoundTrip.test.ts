import { describe, expect, it } from 'vitest';
import { Session } from './support/Session.js';
import { FOREIGN_SVG, OTHER_SVG } from './support/fixtures.js';

/** `read` / `save` behaviour, including the lossless round trip of foreign attributes. */
describe('reading SVG files', () => {
  it('assigns ids to unnamed elements and announces it', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    expect(session.run('read other.svg')).toEqual([
      'warning: assigned id rect1 to unnamed <rect>',
      'read other.svg (7 elements)',
    ]);
  });

  it('takes the canvas size from viewBox when width/height are missing', () => {
    const session = new Session({
      'vb.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect id="r" x="0" y="0" width="1" height="1"/></svg>',
    });
    expect(session.run('read vb.svg')).toEqual(['read vb.svg (1 elements)']);
    expect(session.run('canvas')).toEqual(['canvas 320x240']);
  });

  it('skips element types no provider knows, with a warning', () => {
    const session = new Session({
      'p.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M0 0"/><rect id="r" x="1" y="2" width="3" height="4"/></svg>',
    });
    expect(session.run('read p.svg')).toEqual([
      'warning: unsupported element <path> skipped',
      'read p.svg (1 elements)',
    ]);
  });

  it('renames a duplicated id instead of failing', () => {
    const session = new Session({
      'dup.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="a" x="0" y="0" width="1" height="1"/><circle id="a" cx="1" cy="1" r="1"/></svg>',
    });
    expect(session.run('read dup.svg')).toEqual([
      'warning: duplicate id a in file, assigned id circle1 to <circle>',
      'read dup.svg (2 elements)',
    ]);
    expect(session.run('tree').slice(1)[1]).toContain('circle#circle1');
  });

  it('rejects text that is not an SVG document', () => {
    const session = new Session({ 'bad.svg': '<svg><rect x="1"' });
    expect(session.run('read bad.svg')[0]).toMatch(/^error: cannot parse svg: /);
  });
});

describe('writing SVG files', () => {
  it('round-trips the imported document without losing information', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    session.runAll(['read other.svg', 'save out.svg']);
    expect(session.files.readText('out.svg')).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect id="rect1" x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>
`);

    const reread = new Session({ 'out.svg': session.files.readText('out.svg') });
    expect(reread.run('read out.svg')).toEqual(['read out.svg (7 elements)']);
    expect(reread.run('tree')).toEqual(session.run('tree'));
  });

  it('keeps attributes the kernel does not model', () => {
    const session = new Session({ 'foreign.svg': FOREIGN_SVG });
    session.runAll(['read foreign.svg', 'save copy.svg']);
    const saved = session.files.readText('copy.svg');
    expect(saved).toContain('transform="translate(60,40)"');
    expect(saved).toContain('transform="translate(200,0) scale(0.8)"');
    expect(saved).toContain('text-anchor="middle"');
    expect(saved).toContain('font-size="16"');
    expect(session.run('show nodeB')).toEqual([
      'g#nodeB  parent=g#diagram',
      '  transform=translate(200,0) scale(0.8)',
      '  children=2',
    ]);
  });

  it('saves to the read path when no file name is given', () => {
    const session = new Session({ 'other.svg': OTHER_SVG });
    session.run('read other.svg');
    expect(session.run('save')).toEqual(['saved to other.svg (7 elements)']);
    expect(session.files.readText('other.svg')).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('writes an empty canvas as a self closing root element', () => {
    const session = new Session();
    session.runAll(['init 100 50', 'save empty.svg']);
    expect(session.files.readText('empty.svg')).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50"/>
`);
  });

  it('escapes special characters and reads them back unchanged', () => {
    const session = new Session();
    session.runAll(['init 100 50', 'create text t 1 2 "a & b < c > d \\" q"', 'save esc.svg']);
    const saved = session.files.readText('esc.svg');
    expect(saved).toContain('>a &amp; b &lt; c &gt; d " q</text>');

    const reread = new Session({ 'esc.svg': saved });
    reread.run('read esc.svg');
    expect(reread.run('show t')).toEqual(['text#t  parent=svg', '  (1,2) "a & b < c > d \\" q"']);
  });
});
