/** An element of a parsed XML document: name, attributes, child elements and character data. */
export class XmlElementNode {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: readonly XmlElementNode[];
  readonly text: string;

  constructor(
    name: string,
    attributes: ReadonlyMap<string, string>,
    children: readonly XmlElementNode[],
    text: string,
  ) {
    this.name = name;
    this.attributes = attributes;
    this.children = children;
    this.text = text;
  }
}
