import fs from 'fs';
import path from 'path';
import { parseDocument, type DocumentType } from './parsers';
import { chunkText } from './chunker';
import { generateEmbeddings, hashContent, type EmbeddedChunk } from './embeddings';
import { vectorStore } from './vector-store';

interface DocumentSource {
  id: string;
  title: string;
  path: string;
  type: DocumentType;
  sections: string[];
}

interface DocumentConfig {
  sources: DocumentSource[];
  settings: {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    embeddingModel: string;
  };
}

export interface IngestionStats {
  documentsProcessed: number;
  chunksCreated: number;
  cachedDocuments: number;
  totalEmbeddings: number;
  errors: string[];
}

/**
 * Load the documents.json configuration.
 */
function loadConfig(): DocumentConfig {
  const configPath = path.resolve(process.cwd(), 'documents.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      'documents.json not found. Create it in the project root to configure your knowledge base.'
    );
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as DocumentConfig;
}

/**
 * Run the full ingestion pipeline:
 * 1. Load config
 * 2. Parse each document
 * 3. Chunk the content
 * 4. Generate embeddings (with caching)
 * 5. Load into vector store
 */
export async function ingestDocuments(): Promise<IngestionStats> {
  console.log('\n📚 Starting document ingestion...\n');

  const config = loadConfig();
  const { chunkSize, chunkOverlap, embeddingModel } = config.settings;

  const stats: IngestionStats = {
    documentsProcessed: 0,
    chunksCreated: 0,
    cachedDocuments: 0,
    totalEmbeddings: 0,
    errors: [],
  };

  const allEmbeddedChunks: EmbeddedChunk[] = [];

  for (const source of config.sources) {
    try {
      console.log(`📄 Processing: ${source.title} (${source.path})`);

      // Check if file exists
      const absolutePath = path.resolve(process.cwd(), source.path);
      if (!fs.existsSync(absolutePath)) {
        const msg = `File not found: ${source.path}`;
        console.warn(`  ⚠ ${msg}`);
        stats.errors.push(msg);
        continue;
      }

      // Parse the document
      const parsed = await parseDocument(
        source.path,
        source.type,
        source.sections
      );

      // Create content hash for cache validation
      const contentHash = hashContent(parsed.fullContent);

      // Chunk the content
      const chunks = parsed.sections.flatMap((section) =>
        chunkText(
          section.content,
          {
            sourceId: source.id,
            sourceTitle: source.title,
            sectionTitle: section.title,
            sourcePath: source.path,
          },
          chunkSize,
          chunkOverlap
        )
      );

      stats.chunksCreated += chunks.length;
      console.log(`  → ${chunks.length} chunks created`);

      // Generate embeddings (uses cache if content unchanged)
      const embedded = await generateEmbeddings(
        chunks,
        source.id,
        contentHash,
        embeddingModel
      );

      allEmbeddedChunks.push(...embedded);
      stats.documentsProcessed++;
      stats.totalEmbeddings += embedded.length;
    } catch (error) {
      const msg = `Error processing ${source.title}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.error(`  ✗ ${msg}`);
      stats.errors.push(msg);
    }
  }

  // Load all embeddings into the vector store
  vectorStore.load(allEmbeddedChunks);

  console.log(`\n✅ Ingestion complete!`);
  console.log(`   Documents: ${stats.documentsProcessed}`);
  console.log(`   Chunks: ${stats.chunksCreated}`);
  console.log(`   Embeddings: ${stats.totalEmbeddings}`);
  if (stats.errors.length > 0) {
    console.log(`   Errors: ${stats.errors.length}`);
  }
  console.log('');

  return stats;
}

/**
 * Get the current config settings (for UI display).
 */
export function getConfig(): DocumentConfig {
  return loadConfig();
}
