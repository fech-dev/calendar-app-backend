type FactoryDefinition<T extends object> = () => T;
type FactoryOverride<T extends object> = () => Partial<T>;

export function defineFactory<T extends object>(
  definition: FactoryDefinition<T>,
) {
  return (override: FactoryOverride<T> = () => ({})) => ({
    ...definition(),
    ...override(),
  });
}

export function createMany<T extends object>(
  factory: ReturnType<typeof defineFactory<T>>,
  count: number,
  override?: FactoryOverride<T>,
): T[] {
  return new Array(count).fill(null).map(() => factory(override));
}
