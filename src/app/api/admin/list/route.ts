import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const configPath = path.resolve(process.cwd(), 'documents.json');
    if (!fs.existsSync(configPath)) {
       return NextResponse.json({ sources: [] });
    }
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    return NextResponse.json({ sources: config.sources || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
