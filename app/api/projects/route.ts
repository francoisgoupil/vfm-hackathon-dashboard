import { NextResponse } from 'next/server';
import { listWorkspaceProjects } from '@/lib/skore';

export async function GET() {
  try {
    const projects = await listWorkspaceProjects();
    return NextResponse.json(projects);
  } catch (err) {
    console.error('[projects]', (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
