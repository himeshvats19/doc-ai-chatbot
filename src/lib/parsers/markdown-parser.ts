import fs from 'fs';
import path from 'path';

export interface ParsedSection {
  title: string;
  content: string;
}

export interface ParsedDocument {
  title: string;
  fullContent: string;
  sections: ParsedSection[];
}

/**
 * Parses a markdown file and splits it into sections by headings.
 * Supports filtering specific sections by heading name.
 */
export function parseMarkdown(
  filePath: string,
  sectionFilter: string[]
): ParsedDocument {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const rawContent = fs.readFileSync(absolutePath, 'utf-8');

  const lines = rawContent.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let documentTitle = '';

  for (const line of lines) {
    // Match headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section if it has content
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      // Use the first H1 as the document title
      if (level === 1 && !documentTitle) {
        documentTitle = title;
      }

      currentSection = {
        title,
        content: line + '\n',
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before any heading — create an intro section
      if (line.trim()) {
        if (!currentSection) {
          currentSection = { title: 'Introduction', content: '' };
        }
        currentSection.content += line + '\n';
      }
    }
  }

  // Don't forget the last section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // Apply section filter
  let filteredSections = sections;
  if (!sectionFilter.includes('all')) {
    const filterLower = sectionFilter.map((s) => s.toLowerCase());
    filteredSections = sections.filter((s) =>
      filterLower.includes(s.title.toLowerCase())
    );
  }

  const fullContent = filteredSections
    .map((s) => s.content.trim())
    .join('\n\n');

  return {
    title: documentTitle || path.basename(filePath, path.extname(filePath)),
    fullContent,
    sections: filteredSections,
  };
}
