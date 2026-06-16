import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { TextChunk } from './chunker';

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

interface CacheEntry {
  contentHash: string;
  chunks: EmbeddedChunk[];
}

interface CacheFile {
  version: number;
  entries: Record<string, CacheEntry>;
}

const CACHE_DIR = path.resolve(process.cwd(), '.embeddings-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_VERSION = 1;
const BATCH_SIZE = 100;

/**
 * Generate a content hash to detect changes.
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Load the embedding cache from disk.
 */
function loadCache(): CacheFile {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data.version === CACHE_VERSION) {
        return data;
      }
    }
  } catch {
    // Cache is corrupt or incompatible, start fresh
  }
  return { version: CACHE_VERSION, entries: {} };
}

/**
 * Save the embedding cache to disk.
 */
function saveCache(cache: CacheFile): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch {
    // Gracefully skip on read-only filesystems (e.g. Vercel serverless)
    console.log('  ⚠ Could not write embeddings cache (read-only filesystem)');
  }
}

/**
 * Generate embeddings for a list of text chunks.
 * Uses file-based caching with content-hash invalidation.
 */
export async function generateEmbeddings(
  chunks: TextChunk[],
  sourceId: string,
  contentHash: string,
  modelName: string = 'text-embedding-3-small'
): Promise<EmbeddedChunk[]> {
  const cache = loadCache();

  // Check if this source is already cached with the same content
  const cached = cache.entries[sourceId];
  if (cached && cached.contentHash === contentHash) {
    console.log(`  ✓ Using cached embeddings for "${sourceId}" (${cached.chunks.length} chunks)`);
    return cached.chunks;
  }

  console.log(`  → Generating embeddings for "${sourceId}" (${chunks.length} chunks)...`);

  const embeddedChunks: EmbeddedChunk[] = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => {
      // Inject contextual metadata into the textual representation for embedding
      return `[Document: ${c.metadata.sourceTitle} | Section: ${c.metadata.sectionTitle}]\n\n${c.content}`;
    });

    const { embeddings } = await embedMany({
      model: openai.embedding(modelName),
      values: texts,
    });

    for (let j = 0; j < batch.length; j++) {
      embeddedChunks.push({
        ...batch[j],
        embedding: embeddings[j],
      });
    }
  }

  // Update cache
  cache.entries[sourceId] = {
    contentHash,
    chunks: embeddedChunks,
  };
  saveCache(cache);

  console.log(`  ✓ Generated and cached ${embeddedChunks.length} embeddings`);
  return embeddedChunks;
}

/**
 * Embed a single query string for similarity search.
 */
export async function embedQuery(
  query: string,
  modelName: string = 'text-embedding-3-small'
): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(modelName),
    value: query,
  });
  return embedding;
}
