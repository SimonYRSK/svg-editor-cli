import { InvalidArgumentError } from '../../model/errors/InvalidArgumentError.js';

/**
 * Splits a command line into arguments.
 *
 * Whitespace separates arguments, double quotes group one argument that may
 * contain spaces (`create text t1 20 40 "My Diagram"`), and `\"` escapes a
 * quote inside such an argument. Quoting is a presentation concern, which is
 * why it lives here and not in any command.
 */
export class LineTokenizer {
  tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let started = false;
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (quoted) {
        if (character === '\\' && index + 1 < line.length) {
          current += line[index + 1];
          index += 1;
          continue;
        }
        if (character === '"') {
          quoted = false;
          continue;
        }
        current += character;
        continue;
      }
      if (character === '"') {
        quoted = true;
        started = true;
        continue;
      }
      if (/\s/.test(character)) {
        if (started) {
          tokens.push(current);
          current = '';
          started = false;
        }
        continue;
      }
      current += character;
      started = true;
    }

    if (quoted) throw new InvalidArgumentError('unterminated quoted argument');
    if (started) tokens.push(current);
    return tokens;
  }
}
