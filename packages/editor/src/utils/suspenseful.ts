export interface Suspenseful<T> {
  read: () => T;
}

/** Wrap a promise so that it works with React Suspense */
export function suspenseful<T>(promiseOrAsyncFunc: () => Promise<T>): Suspenseful<T> {
  let response: T;
  let error: Error;
  let status: "pending" | "success" | "error" = "pending";

  const promise = typeof promiseOrAsyncFunc == "function" ? promiseOrAsyncFunc() : promiseOrAsyncFunc;
  const suspender = promise.then(
    (res: T) => {
      status = "success";
      response = res;
      return res;
    },
    (err: Error) => {
      status = "error";
      error = err;
      throw err;
    },
  );

  const read = () => {
    switch (status) {
      case "pending":
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- React suspense requires us to throw the promise
        throw suspender;
      case "error":
        throw error;
      default:
        return response;
    }
  };

  return { read };
}
