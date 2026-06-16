import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, routeId, markdown } = await req.json();

    if (!title || !routeId || !markdown) {
      return NextResponse.json({ error: 'Missing required configuration string parameters. Cannot execute logic limits.' }, { status: 400 });
    }

    const safeRouteId = routeId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const docPath = `docs/${safeRouteId}.md`;
    const absoluteDocPath = path.resolve(process.cwd(), docPath);

    // 1. Physically construct the .md file into the file system
    fs.writeFileSync(absoluteDocPath, markdown);

    // 2. Parse and radically intercept the existing documents.json route map
    const configPath = path.resolve(process.cwd(), 'documents.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);

    const existingIndex = config.sources.findIndex((s: any) => s.id === safeRouteId);
    
    if (existingIndex > -1) {
      config.sources[existingIndex] = { ...config.sources[existingIndex], title, path: docPath };
    } else {
      config.sources.push({
        id: safeRouteId,
        title: title,
        path: docPath,
        type: "md",
        sections: ["all"]
      });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // 3. Initiate the Subprocess Vector Ingestion
    // Use process.execPath to get the absolute path to the running Node binary,
    // since bare 'node' may not be on PATH inside the Next.js server process.
    const ingestScript = path.resolve(process.cwd(), 'scripts/ingest.mjs');
    await execAsync(`"${process.execPath}" "${ingestScript}"`, { 
      cwd: process.cwd(),
      env: { ...process.env }
    });

    return NextResponse.json({ success: true, routeId: safeRouteId });
    
  } catch (error: any) {
    console.error("Vector Publishing Engine Crash:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
