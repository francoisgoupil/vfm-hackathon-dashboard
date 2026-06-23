import { createInitialState, applyPushEvents } from './reducer';
import { fetchAllReports, getSkoreConfig } from './skore';
import { toEvent } from './to-event';
import type { DashboardState, SkoreMeta } from './types';

export async function fetchDashboardSnapshot(): Promise<{
  initialState: DashboardState;
  meta: SkoreMeta;
}> {
  const { SKORE_WORKSPACE_ID, SKORE_API_KEY } = getSkoreConfig();

  if (!SKORE_API_KEY) {
    return {
      initialState: createInitialState(),
      meta: {
        workspace: SKORE_WORKSPACE_ID ?? null,
        hasKey: false,
        projectCount: 0,
        error: 'SKORE_API_KEY is not configured',
        connected: false,
      },
    };
  }

  try {
    const { projects, byProject } = await fetchAllReports();
    const events = byProject
      .flatMap(({ project, reports }) => reports.map((r) => toEvent(r, project)))
      .filter((e) => e.score != null)
      .sort((a, b) => a.ts - b.ts);

    const initialState = applyPushEvents(createInitialState(), events, { silent: true });

    return {
      initialState,
      meta: {
        workspace: SKORE_WORKSPACE_ID ?? null,
        hasKey: true,
        projectCount: projects.length,
        error: null,
        connected: true,
      },
    };
  } catch (err) {
    return {
      initialState: createInitialState(),
      meta: {
        workspace: SKORE_WORKSPACE_ID ?? null,
        hasKey: true,
        projectCount: 0,
        error: (err as Error).message,
        connected: false,
      },
    };
  }
}
