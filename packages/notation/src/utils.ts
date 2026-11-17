export const initPolyObject = <
  Types extends Record<
    string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- constructors of any option type must be accepted
      new (options: any): { readonly type: string };
    }
  >,
>(
  constructorMap: {
    [K in keyof Types & string]: K extends InstanceType<Types[K]>["type"] ? Types[K] : never;
  },
  value: InstanceType<Types[string]>,
): InstanceType<Types[string]> => {
  if (!("prototype" in value) || value.prototype == Object) {
    if ("type" in value && typeof value.type === "string") {
      const constructor = constructorMap[value.type];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime check of an untrusted type discriminator
      if (!constructor) {
        throw new Error(`No constructor found for "${value.type}"`);
      }

      return value instanceof constructor ? value : (new constructor(value) as InstanceType<Types[string]>);
    }

    throw new Error(
      `Received POJO without a valid type discriminator. Valid types: ${Object.keys(constructorMap).join(", ")}`,
    );
  }

  if (Object.values(constructorMap).some((constructor) => value instanceof constructor)) {
    return value;
  }

  throw new Error(
    `Received unexpected object (received: ${value.constructor.name}, expected: ${Object.keys(constructorMap).join(", ")})`,
  );
};

export const initArray = <T, O>(constructor: new (options: O) => T, value: readonly O[] | undefined | null): T[] => {
  return (value ?? []).map((item) => (item instanceof constructor ? item : new constructor(item)));
};
