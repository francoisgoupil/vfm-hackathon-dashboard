import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { ACTIONS } from '../reducer';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function useSimulation(dispatch, enabled = true) {
  const maeRef = useRef(25);
  const reportCounter = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let timeout = null;
    let cancelled = false;

    function schedule() {
      if (cancelled) return;
      const delay = randomBetween(2000, 6000);
      timeout = setTimeout(() => {
        maeRef.current = Math.max(4.5, maeRef.current - randomBetween(0.1, 0.6));
        const noise = randomBetween(-1.2, 1.2);
        const mae = Math.max(3.8, maeRef.current + noise);

        const teamName = pick(CONFIG.TEAMS);
        reportCounter.current += 1;

        dispatch({
          type: ACTIONS.PUSH_EVENT,
          payload: {
            teamName,
            model: pick(CONFIG.MODELS),
            transformer: pick(CONFIG.TRANSFORMERS),
            mae: Number(mae.toFixed(2)),
            r2: Number(randomBetween(0.75, 0.95).toFixed(3)),
            llm: CONFIG.TEAM_LLMS[teamName],
            skill: pick(CONFIG.SKILLS),
            reportId: `sim-${reportCounter.current}`,
            ts: Date.now(),
          },
        });

        schedule();
      }, delay);
    }

    schedule();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [dispatch, enabled]);
}
