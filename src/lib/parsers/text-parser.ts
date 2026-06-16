import fs from 'fs';
import path from 'path';
import type { ParsedDocument } from './markdown-parser';

/**
 * Parses plain text files (.txt).
 */
export function parseTextFile(filePath: string): ParsedDocument {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  return {
    title: path.basename(filePath, path.extname(filePath)),
    fullContent: content.trim(),
    sections: [
      {
        title: path.basename(filePath, path.extname(filePath)),
        content: content.trim(),
      },
    ],
  };
}
