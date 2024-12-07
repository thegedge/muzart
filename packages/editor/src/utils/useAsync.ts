import { useCallback, useEffect, useState, type DependencyList } from "react";

export type AsyncResult<ValueT, ErrorT = unknown> =
  | { pending: true; value: undefined; error: undefined }
  | { pending: false; value: ValueT; error: undefined }
  | { pending: false; value: undefined; error: ErrorT };

export const useAsync = <ValueT, ErrorT = Error>(
  f: () => Promise<ValueT>,
  deps: DependencyList = [],
): AsyncResult<ValueT, ErrorT> => {
  const [result, setResult] = useState<AsyncResult<ValueT, ErrorT>>({
    pending: true,
    error: undefined,
    value: undefined,
  });

  const memoizedF = useCallback(f, deps);

  useEffect(() => {
    let cancelled = false;
    memoizedF()
      .then((value) => !cancelled && setResult({ pending: false, error: undefined, value }))
      .catch((error) => !cancelled && setResult({ pending: false, error, value: undefined }));

    return () => {
      cancelled = true;
    };
  }, [memoizedF]);

  return result;
};
