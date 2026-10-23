/**
 * Hands out `<tag><n>` ids for elements that reach the editor without one
 * (`rect1`, `rect2`, ...), skipping ids that are already taken.
 */
export class AutoIdAssigner {
  private readonly used = new Set<string>();

  reserve(id: string): void {
    this.used.add(id);
  }

  isUsed(id: string): boolean {
    return this.used.has(id);
  }

  /** Reserves and returns the first free `<tagName><n>`. */
  next(tagName: string): string {
    let counter = 1;
    for (;;) {
      const candidate = `${tagName}${counter}`;
      if (!this.used.has(candidate)) {
        this.used.add(candidate);
        return candidate;
      }
      counter += 1;
    }
  }
}
