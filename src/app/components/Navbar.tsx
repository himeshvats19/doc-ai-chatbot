'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync React state purely with the statically executed <head> script
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="global-navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand-link">
          <div className="navbar-logo">📚</div>
          <span className="navbar-brand">ByteChat : A technical journal by Himesh Vats</span>
        </Link>

        <nav className="navbar-links">
          <Link href="/" className="nav-item active">Articles</Link>
          <Link href="/courses" className="nav-item">Courses</Link>
          <a href="https://github.com/himeshvats19/doc-ai-chatbot" target='blank' className="nav-item" style={{ marginRight: '16px' }}>GitHub</a>
          
          {mounted && (
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
