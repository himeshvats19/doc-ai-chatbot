import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const COURSES_PATH = path.resolve(process.cwd(), 'courses.json');

function readCourses() {
  if (!fs.existsSync(COURSES_PATH)) return [];
  const raw = fs.readFileSync(COURSES_PATH, 'utf-8');
  return JSON.parse(raw).courses || [];
}

function writeCourses(courses: any[]) {
  fs.writeFileSync(COURSES_PATH, JSON.stringify({ courses }, null, 2));
}

export async function GET() {
  try {
    const courses = readCourses();
    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, link, image } = await req.json();
    if (!title || !description || !link) {
      return NextResponse.json({ error: 'Title, description, and link are required.' }, { status: 400 });
    }

    const courses = readCourses();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    
    courses.push({ id, title, description, link, image: image || '/hero.png', createdAt: new Date().toISOString() });
    writeCourses(courses);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });

    const courses = readCourses();
    const target = courses.find((c: any) => c.id === id);
    
    // Delete associated image if it exists in course-images
    if (target?.image && target.image.startsWith('/course-images/')) {
      const imgPath = path.resolve(process.cwd(), 'public', target.image.slice(1));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    const filtered = courses.filter((c: any) => c.id !== id);
    writeCourses(filtered);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
