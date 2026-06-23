'use client';

import { useEffect, useRef, useState } from 'react';
import { BASE_PATH, CONFIG } from '@/lib/config';
import { ACTIONS } from '@/lib/reducer';
import type { DashboardAction } from '@/lib/reducer';
import { createSeenStore } from '@/lib/seen';
import { toEvent } from '@/lib/to-event';
import type { NormalizedReport, SkoreMeta, SkoreProject } from '@/lib/types';
import type { Dispatch } from 'react';

interface PollStatus {
  state: 'connecting' | 'live' | 'error';
  projectCount: number;
  error: string | null;
  lastPoll?: number;
}

function initialPollStatus(meta: SkoreMeta, enabled: boolean): PollStatus | null {
  if (!enabled) return null;
  if (meta.error) {
    return { state: 'error', projectCount: meta.projectCount, error: meta.error };
  }
  if (meta.connected) {
    return { state: 'live', projectCount: meta.projectCount, error: null };
  }
  return { state: 'connecting', projectCount: 0, error: null };
}

export function usePolling(
  dispatch: Dispatch<DashboardAction>,
  enabled = true,
  meta?: SkoreMeta,
) {
  const seenRef = useRef(createSeenStore());
  const runningRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const [status, setStatus] = useState<PollStatus | null>(() =>
    meta ? initialPollStatus(meta, enabled) : enabled
      ? { state: 'connecting', projectCount: 0, error: null }
      : null,
  );

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return undefined;
    }

    if (!meta?.connected) {
      setStatus({ state: 'connecting', projectCount: 0, error: null });
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (runningRef.current || cancelled) return;
      runningRef.current = true;

      try {
        const projectsRes = await fetch(`${BASE_PATH}/api/projects`);
        if (!projectsRes.ok) throw new Error(await projectsRes.text());
        const projects: SkoreProject[] = await projectsRes.json();

        const freshReports: { report: NormalizedReport; project: SkoreProject }[] = [];

        for (const project of projects) {
          const reportsRes = await fetch(`${BASE_PATH}/api/reports?project=${encodeURIComponent(project.name)}`);
          if (!reportsRes.ok) continue;
          const summaries: NormalizedReport[] = await reportsRes.json();

          for (const summary of summaries) {
            const seen = seenRef.current.has(summary.id) || seenRef.current.has(summary.urn);
            if (!bootstrappedRef.current) {
              seenRef.current.add(summary.id);
              seenRef.current.add(summary.urn);
              continue;
            }
            if (!seen) {
              freshReports.push({ report: summary, project });
              seenRef.current.add(summary.id);
              seenRef.current.add(summary.urn);
            }
          }
        }

        bootstrappedRef.current = true;

        freshReports.sort(
          (a, b) => new Date(a.report.created_at).getTime() - new Date(b.report.created_at).getTime(),
        );

        for (const { report, project } of freshReports) {
          if (cancelled) break;
          const event = toEvent(report, project);
          if (event.score != null) {
            dispatch({ type: ACTIONS.PUSH_EVENT, payload: event });
          }
        }

        if (!cancelled) {
          setStatus({
            state: 'live',
            projectCount: projects.length,
            error: null,
            lastPoll: Date.now(),
          });
        }
      } catch (err) {
        console.error('[polling]', (err as Error).message);
        if (!cancelled) {
          setStatus((prev) => ({
            state: 'error',
            projectCount: prev?.projectCount ?? 0,
            error: (err as Error).message,
          }));
        }
      } finally {
        runningRef.current = false;
        if (!cancelled) {
          timer = setTimeout(tick, CONFIG.POLL_INTERVAL_MS);
        }
      }
    }

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [dispatch, enabled, meta?.connected]);

  return {
    clearSeen: () => {
      seenRef.current.clear();
      bootstrappedRef.current = false;
    },
    status,
  };
}
