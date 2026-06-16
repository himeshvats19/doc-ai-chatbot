import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function CoursesPage() {
  const coursesPath = path.resolve(process.cwd(), 'courses.json');
  let courses: any[] = [];

  if (fs.existsSync(coursesPath)) {
    try {
      const raw = fs.readFileSync(coursesPath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.courses)) {
        courses = data.courses;
      }
    } catch (e) {
      console.error('Failed to parse courses.json', e);
    }
  }

  return (
    <div className="welcome-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="landing-hero">
        <h3 className="landing-title">
          Recommended <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Courses</span>
        </h3>
        <p className="landing-subtitle">
          A curated list of courses and learning resources to level up your engineering skills.
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="blog-index-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {courses.map((course) => (
            <a key={course.id} href={course.link} target="_blank" rel="noopener noreferrer" className="blog-index-card" style={{ textDecoration: 'none' }}>
              <div className="card-image-wrapper" style={{ backgroundImage: `url('${course.image}')`, backgroundSize: 'cover', backgroundPosition: 'center', height: '200px' }}>
              </div>
              <div className="card-content">
                <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '12px' }}>{course.title}</h2>
                <p className="card-excerpt" style={{ fontSize: '14px', marginBottom: '20px' }}>
                  {course.description}
                </p>
                <div className="card-footer" style={{ marginTop: 'auto' }}>
                  View Course →
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px', border: '1px dashed var(--border-glass)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No courses have been recommended yet.
        </div>
      )}
    </div>
  );
}
