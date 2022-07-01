export function filenameFrom(source: File | Response): string {
  if ("name" in source) {
    return source.name;
  }
  return new URL(source.url).pathname;
}

export function mimeFrom(source: File | Response) {
  if ("name" in source) {
    return source.type;
  }

  return source.headers.get("Content-Type") ?? "application/octet-stream";
}
