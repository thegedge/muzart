export const digits = (num: number) => {
  return Math.abs(num)
    .toString()
    .split("")
    .map((c) => parseInt(c));
};
