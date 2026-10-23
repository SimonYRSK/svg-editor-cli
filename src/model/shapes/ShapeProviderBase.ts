import { NumberText } from '../geometry/NumberText.js';
import { UsageError } from '../errors/UsageError.js';
import type { Shape } from './Shape.js';
import type { ShapeTypeProvider } from './ShapeTypeProvider.js';

/**
 * Shared parsing helpers for the kernel providers, so each provider only
 * declares *which* parameters it has and how they map onto its own fields.
 */
export abstract class ShapeProviderBase implements ShapeTypeProvider {
  abstract readonly typeName: string;
  abstract readonly usage: string;

  abstract createFromParams(id: string, params: readonly string[]): Shape;

  abstract createFromAttributes(
    id: string,
    attributes: ReadonlyMap<string, string>,
    textContent: string | null,
  ): Shape;

  /** Fails with the type's usage line unless `params.length` is allowed. */
  protected requireParams(params: readonly string[], allowedLengths: readonly number[]): void {
    if (!allowedLengths.includes(params.length)) {
      throw new UsageError(this.usage);
    }
  }

  protected numberParam(params: readonly string[], index: number): number {
    return NumberText.parse(params[index]);
  }

  protected measureParam(params: readonly string[], index: number): number {
    return NumberText.parseMeasure(params[index]);
  }

  /** Optional numeric attribute of an imported element; missing means `fallback`. */
  protected numericAttribute(attributes: ReadonlyMap<string, string>, name: string, fallback = 0): number {
    return NumberText.readLenient(attributes.get(name)) ?? fallback;
  }

  /** Optional measure of an imported element; negative / missing means `fallback`. */
  protected measureAttribute(attributes: ReadonlyMap<string, string>, name: string, fallback = 0): number {
    const value = NumberText.readLenient(attributes.get(name));
    return value === null || value < 0 ? fallback : value;
  }
}
