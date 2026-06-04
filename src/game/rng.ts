export function nextRandom(state: number): { value: number; state: number } {
  const newState = (state * 1664525 + 1013904223) >>> 0;
  return { value: newState / 0xffffffff, state: newState };
}

export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    const result = nextRandom(s);
    s = result.state;
    return result.value;
  };
}
