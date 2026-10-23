import { MalformedSvgError } from '../model/errors/MalformedSvgError.js';
import { XmlElementNode } from './XmlElementNode.js';

/**
 * A small, dependency-free XML reader: enough for SVG documents (elements,
 * attributes, comments, CDATA, character entities) and no more.
 *
 * It is used only by `SvgReader`; keeping the XML mechanics in one small class
 * is what allows the reader to talk in terms of shapes instead of characters.
 */
export class XmlTreeParser {
  private static readonly ENTITIES: ReadonlyMap<string, string> = new Map([
    ['amp', '&'],
    ['lt', '<'],
    ['gt', '>'],
    ['quot', '"'],
    ['apos', "'"],
  ]);

  private source = '';
  private cursor = 0;

  parse(source: string): XmlElementNode {
    this.source = source;
    this.cursor = 0;
    this.skipMisc();
    if (!this.startsWith('<')) {
      throw new MalformedSvgError('no root element');
    }
    return this.parseElement();
  }

  // --------------------------------------------------------------- element

  private parseElement(): XmlElementNode {
    this.expect('<');
    const name = this.readName();
    const attributes = this.parseAttributes();
    if (this.consume('/>')) {
      return new XmlElementNode(name, attributes, [], '');
    }
    this.expect('>');

    const children: XmlElementNode[] = [];
    let text = '';

    for (;;) {
      if (this.cursor >= this.source.length) {
        throw new MalformedSvgError(`unexpected end of document inside <${name}>`);
      }
      if (this.startsWith('</')) {
        this.expect('</');
        const closing = this.readName();
        this.skipWhitespace();
        this.expect('>');
        if (closing !== name) {
          throw new MalformedSvgError(`<${name}> closed by </${closing}>`);
        }
        return new XmlElementNode(name, attributes, children, text);
      }
      if (this.consume('<!--')) {
        this.skipUntil('-->');
        continue;
      }
      if (this.consume('<![CDATA[')) {
        text += this.takeUntil(']]>');
        this.consume(']]>');
        continue;
      }
      if (this.consume('<?')) {
        this.skipUntil('?>');
        continue;
      }
      if (this.startsWith('<')) {
        children.push(this.parseElement());
        continue;
      }
      text += this.decode(this.takeUntil('<'));
    }
  }

  private parseAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();
    for (;;) {
      this.skipWhitespace();
      if (this.startsWith('/>') || this.startsWith('>')) return attributes;
      const name = this.readName();
      this.skipWhitespace();
      if (!this.consume('=')) {
        throw new MalformedSvgError(`attribute ${name} has no value`);
      }
      this.skipWhitespace();
      const quote = this.source[this.cursor];
      if (quote !== '"' && quote !== "'") {
        throw new MalformedSvgError(`attribute ${name} is not quoted`);
      }
      this.cursor += 1;
      const raw = this.takeUntil(quote);
      this.cursor += 1;
      attributes.set(name, this.decode(raw));
    }
  }

  // ------------------------------------------------------------- utilities

  private readName(): string {
    const start = this.cursor;
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor] as string;
      if (/[A-Za-z0-9_.:-]/.test(char)) {
        this.cursor += 1;
      } else {
        break;
      }
    }
    if (this.cursor === start) {
      throw new MalformedSvgError('expected a name');
    }
    return this.source.slice(start, this.cursor);
  }

  private skipMisc(): void {
    for (;;) {
      this.skipWhitespace();
      if (this.consume('<?')) {
        this.skipUntil('?>');
        continue;
      }
      if (this.consume('<!--')) {
        this.skipUntil('-->');
        continue;
      }
      if (this.consume('<!DOCTYPE')) {
        this.skipUntil('>');
        continue;
      }
      return;
    }
  }

  private skipWhitespace(): void {
    while (this.cursor < this.source.length && /\s/.test(this.source[this.cursor] as string)) {
      this.cursor += 1;
    }
  }

  private startsWith(token: string): boolean {
    return this.source.startsWith(token, this.cursor);
  }

  private consume(token: string): boolean {
    if (!this.startsWith(token)) return false;
    this.cursor += token.length;
    return true;
  }

  private expect(token: string): void {
    if (!this.consume(token)) {
      throw new MalformedSvgError(`expected ${token}`);
    }
  }

  private takeUntil(token: string): string {
    const end = this.source.indexOf(token, this.cursor);
    if (end < 0) {
      throw new MalformedSvgError(`expected ${token}`);
    }
    const taken = this.source.slice(this.cursor, end);
    this.cursor = end;
    return taken;
  }

  private skipUntil(token: string): void {
    this.takeUntil(token);
    this.consume(token);
  }

  private decode(raw: string): string {
    return raw.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (whole, body: string) => {
      if (body.startsWith('#x') || body.startsWith('#X')) {
        return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
      }
      if (body.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
      }
      return XmlTreeParser.ENTITIES.get(body) ?? whole;
    });
  }
}
