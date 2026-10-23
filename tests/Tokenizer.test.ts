import { describe, expect, it } from 'vitest';
import { InvalidArgumentError } from '../src/model/errors/InvalidArgumentError.js';
import { LineTokenizer } from '../src/presentation/cli/LineTokenizer.js';

describe('line tokenizer', () => {
  const tokenizer = new LineTokenizer();

  it('splits on whitespace', () => {
    expect(tokenizer.tokenize('create rect r1 0 0 10 10')).toEqual([
      'create', 'rect', 'r1', '0', '0', '10', '10',
    ]);
  });

  it('keeps a quoted argument together', () => {
    expect(tokenizer.tokenize('create text t1 20 40 "My Diagram"')).toEqual([
      'create', 'text', 't1', '20', '40', 'My Diagram',
    ]);
  });

  it('keeps an empty quoted argument', () => {
    expect(tokenizer.tokenize('create text t1 20 40 ""')).toEqual([
      'create', 'text', 't1', '20', '40', '',
    ]);
  });

  it('understands escaped quotes and non ASCII characters', () => {
    expect(tokenizer.tokenize('set t1 text "say \\"hi\\" 开始"')).toEqual([
      'set', 't1', 'text', 'say "hi" 开始',
    ]);
  });

  it('collapses repeated whitespace', () => {
    expect(tokenizer.tokenize('  tree   r1  ')).toEqual(['tree', 'r1']);
  });

  it('reports an unterminated quote', () => {
    expect(() => tokenizer.tokenize('create text t1 0 0 "open')).toThrow(InvalidArgumentError);
  });
});
