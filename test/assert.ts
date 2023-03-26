import nodeAssert from "assert";
import { inspect } from "util";

const contains = <T>(actual: unknown, expected: T): void => {
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    nodeAssert.fail(`${inspect(actual)} does not contain ${inspect(expected)}`);
  }
};

const assert: {
  contains: typeof contains;
  equal: typeof nodeAssert.deepStrictEqual;
} = {
  contains,
  equal: nodeAssert.deepStrictEqual,
};

export default assert;
