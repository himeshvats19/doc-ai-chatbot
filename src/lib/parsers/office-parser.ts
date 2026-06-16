import path from 'path';
import { parseOffice } from 'officeparser';
import type { ParsedDocument } from './markdown-parser';

/**
 * Parses binary document formats (PDF, DOCX, PPTX, XLSX, ODT, RTF)
 * using officeparser for text extraction.
 */
export async function parseOfficeDocument(
  filePath: string
): Promise<ParsedDocument> {
  const absolutePath = path.resolve(process.cwd(), filePath);

  try {
    const rawText = await parseOffice(absolutePath);
    let text = '';

    if (typeof rawText === 'string') {
      text = rawText;
    } else if (rawText && typeof rawText === 'object') {
      if (typeof (rawText as any).toText === 'function') {
        text = (rawText as any).toText();
      } else {
        text = JSON.stringify(rawText);
      }
    } else {
      text = String(rawText || '');
    }

    // Clean excessive empty lines safely
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    console.log('Extracted document length:', text.length);

    if (!text || text.length === 0) {
      throw new Error(`No text content extracted from ${filePath}`);
    }

    return {
      title: path.basename(filePath, path.extname(filePath)),
      fullContent: text.trim(),
      sections: [
        {
          title: path.basename(filePath, path.extname(filePath)),
          content: text.trim(),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse ${filePath}: ${errorMessage}`
    );
  }
}
