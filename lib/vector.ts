export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return null;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i];
    const bi = b[i];

    if (!Number.isFinite(ai) || !Number.isFinite(bi)) {
      return null;
    }

    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  if (normA === 0 || normB === 0) {
    return null;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
