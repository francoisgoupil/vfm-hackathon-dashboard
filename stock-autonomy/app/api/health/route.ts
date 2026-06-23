import { NextResponse } from 'next/server';
import { getSkoreConfig } from '@/lib/skore';

export async function GET() {
  const { SKORE_WORKSPACE_ID, SKORE_API_KEY } = getSkoreConfig();
  return NextResponse.json({
    ok: true,
    workspace: SKORE_WORKSPACE_ID ?? null,
    hasKey: Boolean(SKORE_API_KEY),
  });
}
