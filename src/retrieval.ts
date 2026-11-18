import { CodeChunk } from "./ast.js";

export interface SearchRow extends CodeChunk {
  vector: number[];
}
export interface HybridStore {
  vectorSearch(query: number[], limit: number): Promise<SearchRow[]>;
  textSearch(query: string, limit: number): Promise<SearchRow[]>;
}

export function reciprocalRankFusion(vector: SearchRow[], text: SearchRow[], k = 60): SearchRow[] {
  const scores = new Map<string, { row: SearchRow; score: number }>();
  const add = (rows: SearchRow[]) => rows.forEach((row, rank) => {
    const current = scores.get(row.id) ?? { row, score: 0 };
    current.score += 1 / (k + rank + 1);
    scores.set(row.id, current);
  });
  add(vector); add(text);
  return [...scores.values()].sort((a, b) => b.score - a.score).map(({ row }) => row);
}

/** The database adapter is intentionally small: pgvector and tsvector live behind this interface. */
export async function hybridSearch(
  store: HybridStore, query: string, embedding: number[], limit = 10
): Promise<SearchRow[]> {
  const [vector, text] = await Promise.all([
    store.vectorSearch(embedding, limit),
    store.textSearch(query, limit)
  ]);
  return reciprocalRankFusion(vector, text).slice(0, limit);
}
