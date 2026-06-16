import { parseMarkdown, type ParsedDocument } from './markdown-parser';
import { parseOfficeDocument } from './office-parser';
import { parseTextFile } from './text-parser';

export type DocumentType =
  | 'markdown'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'odt'
  | 'rtf'
  | 'txt';

// File types handled by officeparser
const OFFICE_TYPES: DocumentType[] = [
  'pdf',
  'docx',
  'pptx',
  'xlsx',
  'odt',
  'rtf',
];

/**
 * Central parser registry. Routes each document to the appropriate parser
 * based on its type field from documents.json.
 */
export async function parseDocument(
  filePath: string,
  type: DocumentType,
  sections: string[] = ['all']
): Promise<ParsedDocument> {
  if (type === 'markdown') {
    return parseMarkdown(filePath, sections);
  }

  if (type === 'txt') {
    return parseTextFile(filePath);
  }

  if (OFFICE_TYPES.includes(type)) {
    return parseOfficeDocument(filePath);
  }

  throw new Error(`Unsupported document type: ${type}`);
}

/**
 * Infers the document type from a file extension.
 */
export function inferDocumentType(filePath: string): DocumentType {
  const ext = filePath.toLowerCase().split('.').pop();

  const typeMap: Record<string, DocumentType> = {
    md: 'markdown',
    markdown: 'markdown',
    txt: 'txt',
    text: 'txt',
    pdf: 'pdf',
    docx: 'docx',
    doc: 'docx',
    pptx: 'pptx',
    ppt: 'pptx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    odt: 'odt',
    rtf: 'rtf',
  };

  return typeMap[ext || ''] || 'txt';
}

export type { ParsedDocument, ParsedSection } from './markdown-parser';
