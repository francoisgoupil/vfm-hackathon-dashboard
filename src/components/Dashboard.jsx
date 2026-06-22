import { useCallback, useEffect, useReducer, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { USE_SIMULATION } from '../config';
import {
  ACTIONS,
  createInitialState,
  dashboardReducer,
} from '../reducer';
import { SOUNDS } from '../utils/sound';
import { useSimulation } from '../hooks/useSimulation';
import { usePolling } from '../hooks/usePolling';
import Header from './Header';
import Leaderboard from './Leaderboard';
import ActivityFeed from './ActivityFeed';
import SkillsModels from './SkillsModels';
import FloatingBadges from './FloatingBadges';

function useScaleToFit(ref) {
  useEffect(() => {
    function resize() {
      if (!ref.current) return;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      ref.current.style.transform = `scale(${scale})`;
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [ref]);
}

export default function Dashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, undefined, createInitialState);
  const stageRef = useRef(null);
  const polling = usePolling(dispatch, !USE_SIMULATION);

  useScaleToFit(stageRef);

  useSimulation(dispatch, USE_SIMULATION);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: ACTIONS.TICK_COUNTDOWN }), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state._pendingSound || !state.soundEnabled) return;
    const fn = SOUNDS[state._pendingSound];
    if (fn) fn();
  }, [state._pendingSound, state.soundEnabled]);

  useEffect(() => {
    if (!state.flashTeam) return undefined;
    const t = setTimeout(() => dispatch({ type: ACTIONS.SET_FLASH, payload: null }), 600);
    return () => clearTimeout(t);
  }, [state.flashTeam]);

  const handleCleanup = useCallback((ids) => {
    dispatch({ type: ACTIONS.CLEANUP_FEED, payload: ids });
  }, []);

  const handleReset = () => {
    if (!USE_SIMULATION) polling.clearSeen();
    dispatch({ type: ACTIONS.RESET });
  };

  return (
    <div className="stage">
      <div className="dashboard" ref={stageRef} data-theme={state.theme}>
        <Header
          countdownRemaining={state.countdownRemaining}
          soundEnabled={state.soundEnabled}
          onToggleSound={() => dispatch({ type: ACTIONS.TOGGLE_SOUND })}
          theme={state.theme}
        />

        <div className="main-grid">
          <Leaderboard
            teams={state.teams}
            leaderboard={state.leaderboard}
            flashTeam={state.flashTeam}
            globalBestMae={state.globalBestMae}
          />
          <ActivityFeed
            feed={state.feed}
            lastPush={state.lastPush}
            onCleanup={handleCleanup}
          />
        </div>

        <SkillsModels
          modelCounts={state.modelCounts}
          transformerCounts={state.transformerCounts}
        />

        <FloatingBadges
          badges={state.badges}
          onDismiss={(id) => dispatch({ type: ACTIONS.DISMISS_BADGE, payload: id })}
        />
      </div>

      <button
        className="theme-toggle"
        onClick={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
      >
        {state.theme === 'light' ? 'Dark' : 'Light'}
      </button>

      <button className="reset-btn" onClick={handleReset} title="Reset dashboard">
        <RotateCcw size={14} strokeWidth={1.5} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Reset
      </button>

      {USE_SIMULATION ? (
        <div className="mode-indicator sim">SIMULATION MODE</div>
      ) : (
        <div className={`mode-indicator ${polling.status?.state ?? 'connecting'}`}>
          {polling.status?.state === 'live' && (
            <>LIVE SKORE · {polling.status.projectCount} project{polling.status.projectCount !== 1 ? 's' : ''}</>
          )}
          {polling.status?.state === 'connecting' && <>CONNECTING TO SKORE…</>}
          {polling.status?.state === 'error' && <>SKORE ERROR: {polling.status.error}</>}
        </div>
      )}
    </div>
  );
}
