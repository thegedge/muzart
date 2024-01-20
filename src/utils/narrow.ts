/**
 * Narrow a given instance to a given class, or return null if it is not an instance of that class.
 */
export const narrowInstance = <T extends abstract new (...args: never[]) => unknown>(
  obj: unknown,
  clazz: T,
): InstanceType<T> | null => {
  return obj instanceof clazz ? (obj as InstanceType<T>) : null;
};
