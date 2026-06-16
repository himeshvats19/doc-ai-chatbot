'use client';

import { useState } from 'react';
import { login } from '../actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await login(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (err: any) {
      if (err.message !== 'NEXT_REDIRECT') {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="welcome-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Secure Access</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Log in to access the engineering CMS.</p>
        </div>

        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Username</label>
            <input 
              name="username" 
              type="text" 
              required
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '15px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
            <input 
              name="password" 
              type="password" 
              required
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '15px' }}
            />
          </div>

          {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px', 
              width: '100%', 
              background: 'var(--accent-primary)', 
              color: 'white', 
              border: 'none', 
              padding: '14px', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
