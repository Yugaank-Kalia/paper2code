export type TextChunk = {
  text: string;
  chunkIndex: number;
  section: string | null;
  tokens: number;
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(
  rawText: string,
  chunkSize = 500,
  overlap = 100,
  section: string | null = null,
): TextChunk[] {
  const source = rawText.trim();
  if (!source) {
    return [];
  }

  const sentences = source.split(/(?<=[.!?])\s+/);
  const chunks: TextChunk[] = [];

  let current: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > chunkSize && current.length > 0) {
      const chunkTextValue = current.join(" ");
      chunks.push({
        text: chunkTextValue,
        chunkIndex,
        section,
        tokens: currentTokens,
      });
      chunkIndex += 1;

      const overlapSentences: string[] = [];
      let overlapTokens = 0;
      for (let index = current.length - 1; index >= 0; index -= 1) {
        const tokenCount = estimateTokens(current[index]);
        if (overlapTokens + tokenCount > overlap) {
          break;
        }
        overlapSentences.unshift(current[index]);
        overlapTokens += tokenCount;
      }

      current = [...overlapSentences, sentence];
      currentTokens = estimateTokens(current.join(" "));
    } else {
      current.push(sentence);
      currentTokens += sentenceTokens;
    }
  }

  if (current.length > 0) {
    chunks.push({
      text: current.join(" "),
      chunkIndex,
      section,
      tokens: currentTokens,
    });
  }

  return chunks;
}
