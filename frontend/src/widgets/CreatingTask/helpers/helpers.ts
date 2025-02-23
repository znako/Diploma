export const createArrayByLength = (length: number) =>
  Array(length)
    .fill(0)
    .map((_, i) => i);
