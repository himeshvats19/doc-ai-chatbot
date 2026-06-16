import fs from 'fs';
import path from 'path';
import BlogInterface from '../components/BlogInterface';

// Force Server component rendering
export const dynamic = 'force-dynamic';

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const resolvedParams = await params;
  const folder = resolvedParams.folder;

  // Path to the configuration file indicating available resources
  const configPath = path.resolve(process.cwd(), 'documents.json');

  let rawMarkdown = '';
  let blogTitle = `${folder.charAt(0).toUpperCase() + folder.slice(1)} Hub`;
  let targetFilePath = '';

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw);

      // Locate the .md file strictly mapped to this routing ID
      if (Array.isArray(config.sources)) {
        const targetDoc = config.sources.find((s: any) =>
          s.id === folder &&
          typeof s.path === 'string' &&
          s.path.endsWith('.md')
        );

        if (targetDoc) {
          targetFilePath = path.resolve(process.cwd(), targetDoc.path);
          if (targetDoc.title) {
            blogTitle = targetDoc.title;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse documents.json', e);
    }
  }

  // If a physical .md pathway was matched, read the contents natively off disk
  if (targetFilePath && fs.existsSync(targetFilePath)) {
    try {
      rawMarkdown = fs.readFileSync(targetFilePath, 'utf-8');
    } catch (err) {
      console.error(`Failed to read Markdown file at ${targetFilePath}`, err);
    }
  }

  return (
    <div className="app-container" style={{ padding: 0 }}>
      {/* 
        Inject the interactive Client state boundary, parsing the Server-rendered Markdown into 
        the left pane and the RAG Chatbot securely into the right pane.
      */}
      <BlogInterface markdown={rawMarkdown} folder={folder} title={blogTitle} />
    </div>
  );
}
