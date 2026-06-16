'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Conversations', path: '/', icon: '💬' },
    { name: 'Profile', path: '/profile', icon: '👤' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">📚</div>
        <div className="sidebar-brand">ByteChat</div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          // If we are on ANY route other than profile/settings, light up "Conversations" (which maps to our Knowledge Hub concept)
          const isActive = pathname === item.path || (item.name === 'Conversations' && pathname !== '/profile' && pathname !== '/settings');
          return (
            <Link key={item.name} href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">H</div>
          <div className="user-info">
            <div className="user-name">Himesh Vats</div>
            <div className="user-role">Workspace Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
