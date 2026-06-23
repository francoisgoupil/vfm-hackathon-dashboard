'use client';

import { useEffect, useMemo, useReducer, useRef } from 'react';
import { ACTIONS, dashboardReducer } from '@/lib/reducer';
import { bestSubmission } from '@/lib/submissions';
import { SOUNDS } from '@/lib/sound';
import { usePolling } from '@/hooks/usePolling';
import type { DashboardState, SkoreMeta, Submission } from '@/lib/types';
import Leaderboard from './Leaderboard';
import BestSubmission from './BestSubmission';

interface DashboardLiveProps {
  initialState: DashboardState;
  initialBest: Submission | null;
  skoreMeta: SkoreMeta;
}

export default function DashboardLive({
  initialState,
  initialBest,
  skoreMeta,
}: DashboardLiveProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const pollingEnabled = skoreMeta.hasKey && !skoreMeta.error;
  usePolling(dispatch, pollingEnabled, skoreMeta);
  const feedBootstrapped = useRef(false);
  const best = useMemo(() => bestSubmission(state.submissions), [state.submissions]);

  useEffect(() => {
    document.querySelector('.dashboard')?.setAttribute('data-hydrated', 'true');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: ACTIONS.TICK_COUNTDOWN }), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.flashSubmissionId) return undefined;
    const t = setTimeout(() => dispatch({ type: ACTIONS.SET_FLASH, payload: null }), 1200);
    return () => clearTimeout(t);
  }, [state.flashSubmissionId]);

  useEffect(() => {
    if (!state.flashBestId) return undefined;
    const t = setTimeout(() => dispatch({ type: ACTIONS.SET_FLASH_BEST, payload: null }), 1800);
    return () => clearTimeout(t);
  }, [state.flashBestId]);

  useEffect(() => {
    const latest = state.feed[0];
    if (!latest || !state.soundEnabled) return;
    if (!feedBootstrapped.current) {
      feedBootstrapped.current = true;
      return;
    }
    if (latest.isGlobalBest) SOUNDS.globalBest();
    else if (latest.isParticipantBest) SOUNDS.teamBest();
    else SOUNDS.push();
  }, [state.feed, state.soundEnabled]);

  const displayBest = best ?? initialBest;

  return (
    <>
      <div className="main-grid">
        <Leaderboard
          submissions={state.submissions}
          flashSubmissionId={state.flashSubmissionId}
        />
      </div>

      <BestSubmission submission={displayBest} flash={state.flashBestId === displayBest?.id} />
    </>
  );
}
