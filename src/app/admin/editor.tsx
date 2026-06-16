'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from './actions';

export default function Editor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'articles' | 'courses'>('articles');
  
  // ==========================================
  // ARTICLES STATE
  // ==========================================
  const [sources, setSources] = useState<any[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [routeId, setRouteId] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);

  // ==========================================
  // COURSES STATE
  // ==========================================
  const [courses, setCourses] = useState<any[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseLink, setCourseLink] = useState('');
  const [courseImage, setCourseImage] = useState<File | null>(null);
  
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseSuccess, setCourseSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocumentsMap();
    fetchCoursesMap();
  }, []);

  async function fetchDocumentsMap() {
    setIsLibraryLoading(true);
    try {
      const res = await fetch('/api/admin/list');
      const data = await res.json();
      if (res.ok) setSources(data.sources || []);
    } catch(err) {
      console.error(err);
    } finally {
      setIsLibraryLoading(false);
    }
  }

  async function fetchCoursesMap() {
    setIsCoursesLoading(true);
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (res.ok) setCourses(data.courses || []);
    } catch(err) {
      console.error(err);
    } finally {
      setIsCoursesLoading(false);
    }
  }

  // ==========================================
  // ARTICLES LOGIC
  // ==========================================
  async function handleLoadEdit(id: string, incomingTitle: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/read?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sequentially fetch logic parameters');
      
      setTitle(incomingTitle);
      setRouteId(id);
      setMarkdown(data.markdown);
      setIsEditMode(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you absolutely sure you want to permanently destruct this vector memory node?')) return;
    try {
      setError(null);
      setIsLibraryLoading(true);

      const res = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      setSources(s => s.filter(src => src.id !== id));
      if (isEditMode && id === routeId) resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLibraryLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    setRouteId('');
    setMarkdown('');
    setIsEditMode(false);
    setError(null);
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, routeId, markdown })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish.');

      if (isEditMode) {
         await fetchDocumentsMap();
         resetForm();
         setSuccess('Article updated and vectors rebuilt successfully.');
      } else {
         router.push(`/${data.routeId}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!isEditMode && (!routeId || routeId === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))) {
      setRouteId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  // ==========================================
  // COURSES LOGIC
  // ==========================================
  async function handleCoursePublish(e: React.FormEvent) {
    e.preventDefault();
    setCourseLoading(true);
    setCourseError(null);
    setCourseSuccess(null);

    try {
      let imagePath = '';
      
      if (courseImage) {
        const formData = new FormData();
        formData.append('file', courseImage);
        
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload image.');
        imagePath = uploadData.path;
      }

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: courseTitle, description: courseDesc, link: courseLink, image: imagePath })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add course.');

      await fetchCoursesMap();
      setCourseTitle('');
      setCourseDesc('');
      setCourseLink('');
      setCourseImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setCourseSuccess('Course recommendation published successfully.');
    } catch (err: any) {
      setCourseError(err.message);
    } finally {
      setCourseLoading(false);
    }
  }

  async function handleCourseDelete(id: string) {
    if (!confirm('Are you strictly sure you want to decouple this course node?')) return;
    try {
      setCourseError(null);
      setIsCoursesLoading(true);

      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      setCourses(c => c.filter(src => src.id !== id));
    } catch (err: any) {
      setCourseError(err.message);
    } finally {
      setIsCoursesLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 40px' }}>
      
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Admin <span style={{ color: 'var(--accent-primary)' }}>Terminal</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Architect the network flow globally securely.</p>
        </div>
        <form action={logout}>
          <button type="submit" style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Sign Out</button>
        </form>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-glass)', marginBottom: '40px', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('articles')}
          style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'articles' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'articles' ? '2px solid var(--accent-primary)' : 'none', paddingBottom: '10px', marginBottom: '-11px' }}
        >
          Engineering Articles
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          style={{ background: 'none', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'courses' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'courses' ? '2px solid var(--accent-primary)' : 'none', paddingBottom: '10px', marginBottom: '-11px' }}
        >
          Course Recommendations
        </button>
      </div>

      {activeTab === 'articles' ? (
        <>
          {success && <div style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>{success}</div>}

          <div style={{ display: 'flex', gap: '50px', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '350px'}}>
              <div className="blog-hero" style={{ marginBottom: '30px' }}>
                <h1 className="blog-hero-title" style={{ fontSize: '32px', marginBottom: '8px' }}>Active <span style={{ color: 'var(--accent-primary)' }}>Nodes</span></h1>
                <p className="card-excerpt" style={{ fontSize: '15px' }}>Published engineering logs loaded organically into chat embeddings.</p>
              </div>

              {isLibraryLoading ? <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Intercepting bounds...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sources.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No node traces located entirely.</div>}
                  {sources.map(src => (
                    <div key={src.id} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: '24px', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(10px)', transition: 'all var(--transition-base)' }}>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '6px' }}>{src.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', marginBottom: '20px' }}>/{src.id}</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleLoadEdit(src.id, src.title)} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(0,122,255,0.05)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Edit</button>
                        <button onClick={() => handleDelete(src.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Delete</button>
                        <button onClick={() => router.push(`/${src.id}`)} style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', background: 'transparent', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: '1.5', minWidth: '400px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '36px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                 <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{isEditMode ? 'Update Root Architecture' : 'Scaffold Vector Matrix'}</h2>
                 {isEditMode && <button onClick={resetForm} style={{ color: 'var(--text-primary)', background: 'var(--border-subtle)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>+ Scaffold Empty</button>}
              </div>

              <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Structure Name</label>
                    <input value={title} onChange={handleTitleChange} required placeholder="E.g. Protocol Maps" style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Namespace Routing ID</label>
                    <input value={routeId} onChange={(e) => setRouteId(e.target.value)} required placeholder="protocols" disabled={isEditMode} style={{ width: '100%', background: isEditMode ? 'rgba(0,0,0,0.1)' : 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '14px', opacity: isEditMode ? 0.6 : 1 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Markdown Architecture Schema</label>
                  <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} required placeholder="# Start plotting systems..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '24px', borderRadius: 'var(--radius-md)', fontSize: '15px', fontFamily: 'var(--font-mono)', lineHeight: 1.6, minHeight: '500px', resize: 'vertical' }} />
                </div>

                {error && <div style={{ color: '#ef4444', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)' }}>{error}</div>}

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', textAlign: 'right' }}>
                  <button type="submit" disabled={loading} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '16px 36px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: 'var(--shadow-glow)' }}>
                    {loading ? '🧠 Embedding Vectors...' : (isEditMode ? 'Update Database Layer' : 'Inject Full Node Pipeline')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          {courseSuccess && <div style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>{courseSuccess}</div>}
          
          <div style={{ display: 'flex', gap: '50px', flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Courses Library */}
            <div style={{ flex: '1', minWidth: '350px'}}>
              <div className="blog-hero" style={{ marginBottom: '30px' }}>
                <h1 className="blog-hero-title" style={{ fontSize: '32px', marginBottom: '8px' }}>Active <span style={{ color: 'var(--accent-primary)' }}>Courses</span></h1>
                <p className="card-excerpt" style={{ fontSize: '15px' }}>Top tier infrastructure curriculum pipelines mapped for learning.</p>
              </div>

              {isCoursesLoading ? <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Mapping bounds...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {courses.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No courses traced yet.</div>}
                  {courses.map(src => (
                    <div key={src.id} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: '24px', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(10px)', transition: 'all var(--transition-base)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', backgroundImage: `url('${src.image}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', flexShrink: 0 }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>{src.title}</div>
                        <a href={src.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '13px', textDecoration: 'none', marginBottom: '16px', display: 'block' }}>View Scope ↗</a>
                        <button onClick={() => handleCourseDelete(src.id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Disconnect</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Courses Editor */}
            <div style={{ flex: '1.5', minWidth: '400px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '36px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                 <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pipeline Recommendation</h2>
              </div>

              <form onSubmit={handleCoursePublish} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Course Title String</label>
                  <input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required placeholder="Advanced Distributed Systems 101" style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 'bold' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Network Execution URL (Link)</label>
                  <input value={courseLink} type="url" onChange={e => setCourseLink(e.target.value)} required placeholder="https://..." style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '15px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Matrix Architecture Description</label>
                  <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} required placeholder="Brief description to push into bounds..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '24px', borderRadius: 'var(--radius-md)', fontSize: '15px', lineHeight: 1.6, minHeight: '150px', resize: 'vertical' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Environment Banner Image (.PNG/.JPG)</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setCourseImage(e.target.files?.[0] || null)} required style={{ width: '100%', color: 'var(--text-primary)' }} />
                </div>

                {courseError && <div style={{ color: '#ef4444', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)' }}>{courseError}</div>}

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', textAlign: 'right' }}>
                  <button type="submit" disabled={courseLoading} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '16px 36px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '15px', cursor: courseLoading ? 'not-allowed' : 'pointer', opacity: courseLoading ? 0.7 : 1, transition: 'all 0.2s', boxShadow: 'var(--shadow-glow)' }}>
                    {courseLoading ? 'Syncing Node Networks...' : 'Map Recommendation Pipe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
