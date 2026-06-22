import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { listProjects, listReports } from '../api/skore';
import { toEvent } from '../api/toEvent';
import { createSeenStore } from '../utils/seen';
import { ACTIONS } from '../reducer';

export function usePolling(dispatch, enabled = true) {
  const seenRef = useRef(createSeenStore());
  const runningRef = useRef(false);
  const firstTickRef = useRef(true);
  const [status, setStatus] = useState(
    enabled ? { state: 'connecting', projectCount: 0, error: null } : null,
  );

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      return undefined;
    }

    setStatus({ state: 'connecting', projectCount: 0, error: null });

    let cancelled = false;
    let timer = null;

    async function tick() {
      if (runningRef.current || cancelled) return;
      runningRef.current = true;

      try {
        const projects = await listProjects();
        const freshReports = [];

        for (const project of projects) {
          const summaries = await listReports(project.name);
          const unseen = summaries.filter(
            (s) => !seenRef.current.has(s.id) && !seenRef.current.has(s.urn),
          );

          if (CONFIG.REPLAY_EXISTING && firstTickRef.current && summaries.length > 0) {
            seenRef.current.addAll(
              summaries.flatMap((s) => [s.id, s.urn].filter(Boolean)),
            );
            continue;
          }

          for (const summary of unseen) {
            freshReports.push({ report: summary, project });
            seenRef.current.add(summary.id);
            seenRef.current.add(summary.urn);
          }
        }

        freshReports.sort(
          (a, b) => new Date(a.report.created_at) - new Date(b.report.created_at),
        );

        for (const { report, project } of freshReports) {
          if (cancelled) break;
          const event = toEvent(report, project);
          if (event.mae != null) {
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
        console.error('[polling]', err.message);
        if (!cancelled) {
          setStatus((prev) => ({
            state: 'error',
            projectCount: prev?.projectCount ?? 0,
            error: err.message,
          }));
        }
      } finally {
        firstTickRef.current = false;
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
  }, [dispatch, enabled]);

  return {
    clearSeen: () => seenRef.current.clear(),
    status,
  };
}
