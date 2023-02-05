import { Inputs, useEffect, useState } from "preact/hooks";

export type AsyncResult<ValueT, ErrorT = unknown> =
  | { pending: true; value: undefined; error: undefined }
  | { pending: false; value: ValueT; error: undefined }
  | { pending: false; value: undefined; error: ErrorT };

export const useAsync = <ValueT, ErrorT = unknown>(
  f: () => Promise<ValueT>,
  inputs: Inputs = []
): AsyncResult<ValueT, ErrorT> => {
  const [result, setResult] = useState<AsyncResult<ValueT, ErrorT>>({
    pending: true,
    error: undefined,
    value: undefined,
  });

  useEffect(() => {
    f()
      .then((value) => setResult({ pending: false, error: undefined, value }))
      .catch((error) => setResult({ pending: false, error, value: undefined }));
  }, inputs);

  return result;
};
