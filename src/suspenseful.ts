export interface Suspenseful<T> {
  read: () => T;
}

/** Wrap a promise so that it works with React Suspense */
export default function suspenseful<T>(promise: Promise<T>): Suspenseful<T> {
  let response: T;
  let status: "pending" | "success" | "error" = "pending";
  const suspender = promise.then(
    (res) => {
      status = "success";
      response = res;
    },
    (err) => {
      status = "error";
      response = err;
    }
  );

  const read = () => {
    switch (status) {
      case "pending":
        throw suspender;
      case "error":
        throw response;
      default:
        return response;
    }
  };

  return { read };
}
