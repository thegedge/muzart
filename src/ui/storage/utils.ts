export const dataURItoBlob = (dataURI: string): Blob => {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString: string;
  if (dataURI.split(",")[0].includes("base64")) {
    byteString = window.atob(dataURI.split(",")[1]);
  } else {
    byteString = decodeURIComponent(dataURI.split(",")[1]);
  }

  // separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
};

export const blobToDataURI = (blob: Blob): Promise<string> => {
  let resolve: (v: string) => void;
  let reject: (err: unknown) => void;

  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const fr = new FileReader();
  fr.onload = () => {
    if (typeof fr.result === "string") {
      resolve(fr.result);
      return;
    }

    reject("unexpected result when converting blob to data uri");
  };

  fr.onerror = () => {
    reject(fr.error ?? new Error(`unknown error converting blob to data uri`));
  };

  fr.readAsDataURL(blob);

  return promise;
};
