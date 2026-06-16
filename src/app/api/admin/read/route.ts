import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('id');
    
    if (!routeId) return NextResponse.json({ error: 'Missing ID tracking matrix bounds.' }, { status: 400 });

    const safeRouteId = routeId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const docPath = `docs/${safeRouteId}.md`;
    const absolutePath = path.resolve(process.cwd(), docPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'Physical Node structure not found entirely' }, { status: 404 });
    }
    const markdown = fs.readFileSync(absolutePath, 'utf-8');
    return NextResponse.json({ markdown });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
