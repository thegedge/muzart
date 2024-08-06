export const initPolyObject = <
  Types extends Record<
    string,
    {
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
      if (!constructor) {
        throw new Error(`No constructor found for "${value.type}"`);
      }

      return new constructor(value) as InstanceType<Types[string]>;
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

export const initArray = <T extends { new (options: any): any }>(constructor: T, value: any[] | undefined | null) => {
  return (value ?? []).map((item) => new constructor(item));
};
