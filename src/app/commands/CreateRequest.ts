/** A parsed `create` command line: type, id, positional parameters and the optional container. */
export class CreateRequest {
  readonly typeName: string;
  readonly id: string;
  readonly params: readonly string[];
  readonly containerId: string | null;

  constructor(typeName: string, id: string, params: readonly string[], containerId: string | null) {
    this.typeName = typeName;
    this.id = id;
    this.params = params;
    this.containerId = containerId;
  }
}
