#!/usr/bin/env node

/**
 * Build-time ingestion script.
 * Runs BEFORE `next build` to pre-generate embeddings and cache them
 * so the Vercel deployment ships with a ready-to-use vector cache.
 *
 * Usage: node scripts/ingest.mjs
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pkg from '@next/env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────
const CACHE_DIR = path.join(ROOT, '.embeddings-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_VERSION = 1;
const BATCH_SIZE = 100;

// Dynamically import the AI SDK (ESM)
const { loadEnvConfig } = pkg;
loadEnvConfig(ROOT);

const { embedMany } = await import('ai');
const { openai } = await import('@ai-sdk/openai');

// ─── Helpers ───────────────────────────────────────────────────────

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data.version === CACHE_VERSION) return data;
    }
  } catch { /* start fresh */ }
  return { version: CACHE_VERSION, entries: {} };
}

function saveCache(cache) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
}

// ─── Parsers ───────────────────────────────────────────────────────

async function parseFile(filePath, type) {
  const abs = path.resolve(ROOT, filePath);

  if (type === 'md' || type === 'markdown') {
    const raw = fs.readFileSync(abs, 'utf-8');
    return raw.replace(/\n{3,}/g, '\n\n').trim();
  }

  // PDF / DOCX via officeparser
  const { parseOffice } = await import('officeparser');
  const rawText = await parseOffice(abs);

  let text = '';
  if (typeof rawText === 'string') {
    text = rawText;
  } else if (rawText && typeof rawText === 'object') {
    if (typeof rawText.toText === 'function') {
      text = rawText.toText();
    } else {
      text = JSON.stringify(rawText);
    }
  } else {
    text = String(rawText || '');
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Chunker ───────────────────────────────────────────────────────

function chunkText(text, metadata, chunkSize = 500, chunkOverlap = 100) {
  if (!text || text.trim().length === 0) return [];
  const clean = text.replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= chunkSize) {
    return [{ content: clean, metadata: { ...metadata, chunkIndex: 0 } }];
  }

  const chunks = [];
  let start = 0;
  let idx = 0;
  const separators = ['\n\n', '\n', '. ', ' '];

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end >= clean.length) {
      end = clean.length;
    } else {
      for (const sep of separators) {
        const bi = clean.lastIndexOf(sep, end);
        if (bi !== -1 && bi > start + chunkSize * 0.2) {
          end = sep === '. ' ? bi + 1 : bi;
          break;
        }
      }
    }

    const c = clean.slice(start, end).trim();
    if (c.length > 0) {
      chunks.push({ content: c, metadata: { ...metadata, chunkIndex: idx } });
      idx++;
    }

    let next = end - chunkOverlap;
    if (next > start) {
      const nb = clean.indexOf(' ', next);
      if (nb !== -1 && nb < end) next = nb + 1;
    } else {
      next = end;
    }
    start = Math.max(start + 1, next);
  }

  return chunks;
}

// ─── Embedder ──────────────────────────────────────────────────────

async function generateEmbeddings(chunks, sourceId, contentHash, modelName) {
  const cache = loadCache();
  const cached = cache.entries[sourceId];
  if (cached && cached.contentHash === contentHash) {
    console.log(`  ✓ Using cached embeddings for "${sourceId}" (${cached.chunks.length} chunks)`);
    return cached.chunks;
  }

  console.log(`  → Generating embeddings for "${sourceId}" (${chunks.length} chunks)...`);
  const embedded = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(
      (c) => `[Document: ${c.metadata.sourceTitle} | Section: ${c.metadata.sectionTitle}]\n\n${c.content}`
    );

    const { embeddings } = await embedMany({
      model: openai.embedding(modelName),
      values: texts,
    });

    for (let j = 0; j < batch.length; j++) {
      embedded.push({ ...batch[j], embedding: embeddings[j] });
    }
  }

  cache.entries[sourceId] = { contentHash, chunks: embedded };
  saveCache(cache);
  console.log(`  ✓ Generated and cached ${embedded.length} embeddings`);
  return embedded;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔨 Build-time ingestion starting...\n');

  const configPath = path.join(ROOT, 'documents.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ documents.json not found!');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const { chunkSize, chunkOverlap, embeddingModel } = config.settings;

  let totalChunks = 0;
  let totalDocs = 0;

  for (const source of config.sources) {
    try {
      console.log(`📄 Processing: ${source.title} (${source.path})`);

      const abs = path.resolve(ROOT, source.path);
      if (!fs.existsSync(abs)) {
        console.warn(`  ⚠ File not found: ${source.path} — skipping`);
        continue;
      }

      const text = await parseFile(source.path, source.type);
      if (!text) {
        console.warn(`  ⚠ No text extracted from ${source.path}`);
        continue;
      }

      const contentHash = hashContent(text);

      const chunks = chunkText(
        text,
        {
          sourceId: source.id,
          sourceTitle: source.title,
          sectionTitle: source.title,
          sourcePath: source.path,
        },
        chunkSize,
        chunkOverlap
      );

      console.log(`  → ${chunks.length} chunks created`);

      await generateEmbeddings(chunks, source.id, contentHash, embeddingModel);

      totalChunks += chunks.length;
      totalDocs++;
    } catch (err) {
      console.error(`  ✗ Error processing ${source.title}:`, err.message);
    }
  }

  console.log(`\n✅ Build-time ingestion complete!`);
  console.log(`   Documents: ${totalDocs}`);
  console.log(`   Chunks: ${totalChunks}\n`);
}

main().catch((err) => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
