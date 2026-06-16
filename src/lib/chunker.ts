export interface ChunkMetadata {
  sourceId: string;
  sourceTitle: string;
  sectionTitle: string;
  sourcePath: string;
  chunkIndex: number;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

/**
 * Splits text into overlapping chunks, preferring to break at sentence
 * or word boundaries rather than mid-word.
 */
export function chunkText(
  text: string,
  metadata: Omit<ChunkMetadata, 'chunkIndex'>,
  chunkSize: number = 500,
  chunkOverlap: number = 100
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();

  if (cleanText.length <= chunkSize) {
    return [
      {
        content: cleanText,
        metadata: { ...metadata, chunkIndex: 0 },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  // The order represents structural importance. Prioritize paragraphs -> lines -> sentences -> words
  const separators = ['\n\n', '\n', '. ', ' '];

  while (start < cleanText.length) {
    let end = start + chunkSize;

    if (end >= cleanText.length) {
      end = cleanText.length;
    } else {
      let foundBreak = false;
      
      // Attempt to split at highest priority semantic boundary
      for (const sep of separators) {
        let breakIndex = cleanText.lastIndexOf(sep, end);
        
        // Ensure break is somewhat recent (avoid splitting too early producing tiny chunks)
        if (breakIndex !== -1 && breakIndex > start + (chunkSize * 0.2)) {
          end = sep === '. ' ? breakIndex + 1 : breakIndex;
          foundBreak = true;
          break;
        }
      }
    }

    const chunkContent = cleanText.slice(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        metadata: { ...metadata, chunkIndex },
      });
      chunkIndex++;
    }

    // Step forward, overlapping for continuity but avoiding mid-word slicing
    let nextStart = end - chunkOverlap;
    
    if (nextStart > start) {
      // Find the nearest word boundary so we don't start the next chunk mid-word
      const nearestBoundary = cleanText.indexOf(' ', nextStart);
      if (nearestBoundary !== -1 && nearestBoundary < end) {
        nextStart = nearestBoundary + 1;
      }
    } else {
      // If the chunk produced was smaller than the overlap size, just step forward normally
      nextStart = end;
    }

    start = Math.max(start + 1, nextStart);
  }

  return chunks;
}
