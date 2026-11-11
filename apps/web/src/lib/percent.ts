/** `done` out of `total` as a whole percentage. Zero, not a division error, when there is nothing to do. */
export const percentOf = (done: number, total: number): number =>
  total === 0 ? 0 : Math.round((done / total) * 100);
