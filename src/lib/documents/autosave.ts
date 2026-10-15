/**
 * Client-side save generation guard.
 * Increments on each save request; only the latest generation may update UI status.
 */
export function createSaveGeneration() {
  let generation = 0;

  return {
    next(): number {
      generation += 1;
      return generation;
    },
    isCurrent(value: number): boolean {
      return value === generation;
    },
    current(): number {
      return generation;
    },
  };
}

export function shouldApplySaveResult(
  requestGeneration: number,
  latestGeneration: number,
): boolean {
  return requestGeneration === latestGeneration;
}
