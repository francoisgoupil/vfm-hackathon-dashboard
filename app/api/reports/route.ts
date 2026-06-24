import { NextRequest, NextResponse } from 'next/server';
import { listProjectReports } from '@/lib/skore';

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get('project');
  if (!project) {
    return NextResponse.json({ error: 'project query param required' }, { status: 400 });
  }

  try {
    const reports = await listProjectReports(project);
    return NextResponse.json(reports);
  } catch (err) {
    console.error('[reports]', project, (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
