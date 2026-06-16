import fs from 'fs';
import path from 'path';
import type { EmbeddedChunk } from './embeddings';

export interface SearchResult {
  chunk: EmbeddedChunk;
  score: number;
}

/**
 * In-memory vector store with cosine similarity search.
 * Singleton instance shared across API requests.
 */
class VectorStore {
  private chunks: EmbeddedChunk[] = [];
  private initialized: boolean = false;

  /**
   * Load embedded chunks into the store.
   */
  load(chunks: EmbeddedChunk[]): void {
    this.chunks = chunks;
    this.initialized = true;
    console.log(`VectorStore: Loaded ${chunks.length} chunks`);
  }

  /**
   * Attempt to load vectors from the pre-built cache file.
   * This is used on Vercel cold starts where the full ingestion
   * pipeline cannot run (read-only filesystem, no build-time context).
   */
  loadFromCache(): boolean {
    try {
      const cachePath = path.resolve(process.cwd(), '.embeddings-cache', 'cache.json');
      if (!fs.existsSync(cachePath)) return false;

      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      if (!data.entries) return false;

      const allChunks: EmbeddedChunk[] = [];
      for (const entry of Object.values(data.entries) as any[]) {
        if (entry.chunks) allChunks.push(...entry.chunks);
      }

      if (allChunks.length === 0) return false;

      this.chunks = allChunks;
      this.initialized = true;
      console.log(`VectorStore: Loaded ${allChunks.length} chunks from build-time cache`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the store has been initialized.
   */
  isReady(): boolean {
    return this.initialized && this.chunks.length > 0;
  }

  /**
   * Get the total number of chunks in the store.
   */
  size(): number {
    return this.chunks.length;
  }

  /**
   * Search for the most similar chunks to a query embedding.
   */
  search(queryEmbedding: number[], topK: number = 5, folderFilter: string | null = null): SearchResult[] {
    if (!this.isReady()) {
      return [];
    }

    let searchSpace = this.chunks;

    // Isolate context if a localized article route is active
    if (folderFilter) {
      searchSpace = searchSpace.filter((chunk) =>
        chunk.metadata.sourcePath.includes(folderFilter)
      );
    }

    const scored = searchSpace.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by score descending and return top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Clear the store.
   */
  clear(): void {
    this.chunks = [];
    this.initialized = false;
  }
}

/**
 * Calculate cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// Singleton instance
export const vectorStore = new VectorStore();
