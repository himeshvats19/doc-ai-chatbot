import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { routeId } = await req.json();
    if (!routeId) return NextResponse.json({ error: 'Missing logic boundary ID targets' }, { status: 400 });

    const safeRouteId = routeId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const docPath = path.resolve(process.cwd(), `docs/${safeRouteId}.md`);
    const configPath = path.resolve(process.cwd(), 'documents.json');

    // 1. Decouple and strictly un-link the physical .md structure payload
    if (fs.existsSync(docPath)) {
      fs.unlinkSync(docPath);
    }

    // 2. Eradicate node JSON bounds strictly out of registry config loop
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw);
      
      const prevLength = config.sources?.length || 0;
      config.sources = (config.sources || []).filter((s: any) => s.id !== safeRouteId);
      
      if (prevLength !== config.sources.length) {
         fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }
    }

    // 3. Demolish Orphaned Embedding Vector Maps dynamically out of cache memory bounds
    await execAsync('node scripts/ingest.mjs', { cwd: process.cwd() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
