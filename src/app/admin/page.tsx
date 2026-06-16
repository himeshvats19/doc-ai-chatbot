import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Editor from './editor';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    redirect('/admin/login');
  }

  return (
    <div className="app-container" style={{ minHeight: '80vh', padding: '0 20px' }}>
      <Editor />
    </div>
  );
}
