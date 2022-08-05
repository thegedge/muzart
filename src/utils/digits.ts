export const digits = (num: number) => {
  return num
    .toString()
    .split("")
    .map((c) => parseInt(c));
};
