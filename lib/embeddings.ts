import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;

export async function embedTextBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const results = await Promise.all(
    texts.map((text) =>
      hf.featureExtraction({ model: EMBEDDING_MODEL, inputs: text })
    )
  );

  return results as number[][];
}

export async function embedText(text: string): Promise<number[]> {
  const embeddings = await embedTextBatch([text]);
  if (!embeddings[0]) {
    throw new Error("Missing embedding result from Ollama.");
  }

  return embeddings[0];
}
