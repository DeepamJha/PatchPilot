export function reciprocalRankFusion(vector, text, k = 60) {
    const scores = new Map();
    const add = (rows) => rows.forEach((row, rank) => {
        const current = scores.get(row.id) ?? { row, score: 0 };
        current.score += 1 / (k + rank + 1);
        scores.set(row.id, current);
    });
    add(vector);
    add(text);
    return [...scores.values()].sort((a, b) => b.score - a.score).map(({ row }) => row);
}
/** The database adapter is intentionally small: pgvector and tsvector live behind this interface. */
export async function hybridSearch(store, query, embedding, limit = 10) {
    const [vector, text] = await Promise.all([
        store.vectorSearch(embedding, limit),
        store.textSearch(query, limit)
    ]);
    return reciprocalRankFusion(vector, text).slice(0, limit);
}
