import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RootLandingPage() {
  // Dynamically extract folders from documents.json
  const configPath = path.resolve(process.cwd(), 'documents.json');
  const articles: Array<{ id: string; title: string }> = [];

  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    try {
      const config = JSON.parse(raw);
      if (Array.isArray(config.sources)) {
        config.sources.forEach((s: any) => {
          if (s.id && typeof s.path === 'string' && s.path.endsWith('.md')) {
            articles.push({ id: s.id, title: s.title || s.id });
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse documents.json', e);
    }
  }

  return (
    <div className="welcome-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="landing-hero">
        <h3 className="landing-title">
          The Engineering Log: <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Beyond the Frameworks</span>
        </h3>
        <p className="landing-subtitle">
          Deep-dives into scalable systems, frontend infrastructure, and distributed node networks. Each post is equipped with an AI strictly bounded to the logic.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="blog-index-grid">
          {articles.map((article) => (
            <Link key={article.id} href={`/${article.id}`} className="blog-index-card">
              <div className="card-image-wrapper" style={{ backgroundImage: "url('/hero.png')" }}>
                <div className="card-date-badge">Apr 18, 2026</div>
              </div>
              <div className="card-content">
                <div className="card-category">ARCHITECTURE</div>
                <h2 className="card-title">{article.title}</h2>
                <p className="card-excerpt">
                  Read the full architectural post and interact with the AI assistant natively.
                </p>
                <div className="card-footer">
                  Read Post →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ padding: '30px', border: '1px dashed var(--border-glass)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No knowledge bases have been configured yet.<br />
          Update <code>documents.json</code> to surface new routes.
        </div>
      )}
    </div>
  );
}
