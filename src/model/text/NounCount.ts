/**
 * Renders a counted noun for command messages ("1 child", "2 children").
 *
 * Counts appear in `group`, `ungroup`, `scale`, `read` and `save` output, so the
 * singular/plural decision is made once instead of in five commands.
 */
export class NounCount {
  private constructor() {}

  static of(count: number, singular: string, plural?: string): string {
    const noun = count === 1 ? singular : (plural ?? `${singular}s`);
    return `${count} ${noun}`;
  }
}
