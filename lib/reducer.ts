import { CONFIG } from './config';
import { parseReportNumericId } from './submissions';
import type { DashboardState, PushEvent, Submission } from './types';

export const ACTIONS = {
  PUSH_EVENT: 'PUSH_EVENT',
  TICK_COUNTDOWN: 'TICK_COUNTDOWN',
  TOGGLE_SOUND: 'TOGGLE_SOUND',
  TOGGLE_THEME: 'TOGGLE_THEME',
  RESET: 'RESET',
  CLEANUP_FEED: 'CLEANUP_FEED',
  SET_FLASH: 'SET_FLASH',
  SET_FLASH_BEST: 'SET_FLASH_BEST',
} as const;

type Action =
  | { type: typeof ACTIONS.PUSH_EVENT; payload: PushEvent }
  | { type: typeof ACTIONS.TICK_COUNTDOWN }
  | { type: typeof ACTIONS.TOGGLE_SOUND }
  | { type: typeof ACTIONS.TOGGLE_THEME }
  | { type: typeof ACTIONS.RESET }
  | { type: typeof ACTIONS.CLEANUP_FEED; payload: string[] }
  | { type: typeof ACTIONS.SET_FLASH; payload: string | null }
  | { type: typeof ACTIONS.SET_FLASH_BEST; payload: string | null };

export type DashboardAction = Action;

export function createInitialState(): DashboardState {
  return {
    submissions: [],
    feed: [],
    globalBestScore: null,
    soundEnabled: false,
    theme: 'light',
    countdownRemaining: CONFIG.COUNTDOWN_SEC,
    flashSubmissionId: null,
    flashBestId: null,
  };
}

function isBetterScore(candidate: number, reference: number | null): boolean {
  if (reference == null) return true;
  return CONFIG.SCORE_HIGHER_IS_BETTER ? candidate > reference : candidate < reference;
}

function priorSubmissions(state: DashboardState, participantName: string): Submission[] {
  return state.submissions
    .filter((s) => s.participantName === participantName)
    .sort((a, b) => a.ts - b.ts);
}

function participantBestScore(state: DashboardState, participantName: string): number | null {
  const scores = priorSubmissions(state, participantName).map((s) => s.score);
  if (!scores.length) return null;
  return CONFIG.SCORE_HIGHER_IS_BETTER ? Math.max(...scores) : Math.min(...scores);
}

type ReducerState = DashboardState & {
  _pendingSound?: 'globalBest' | 'teamBest' | 'push';
};

function handlePushEvent(state: DashboardState, event: PushEvent): ReducerState {
  if (event.score == null || Number.isNaN(event.score)) return state;

  const submissionId = String(event.reportId ?? `${event.participantName}-${event.ts}`);
  if (state.submissions.some((s) => s.id === submissionId)) return state;

  const prior = priorSubmissions(state, event.participantName);
  const submissionNumber = prior.length + 1;
  const prevScore = prior.length ? prior[prior.length - 1].score : null;

  const submission: Submission = {
    id: submissionId,
    reportNumericId: parseReportNumericId(event.reportId),
    participantName: event.participantName,
    experiment: event.experiment,
    hubKey: event.hubKey,
    model: event.model,
    reportType: event.reportType,
    score: event.score,
    prevScore,
    submissionNumber,
    ts: event.ts || Date.now(),
    llm: event.llm,
    skill: event.skill,
  };

  const bestBefore = participantBestScore(state, event.participantName);
  const isParticipantBest = isBetterScore(event.score, bestBefore);
  const isGlobalBest = isBetterScore(event.score, state.globalBestScore);

  const feedItem = {
    id: submissionId,
    participantName: event.participantName,
    experiment: event.experiment,
    model: event.model,
    reportType: event.reportType,
    score: event.score,
    llm: event.llm,
    skill: event.skill,
    ts: submission.ts,
    isParticipantBest,
    isGlobalBest,
    fading: false,
  };

  let next: DashboardState = {
    ...state,
    submissions: [...state.submissions, submission],
    feed: [feedItem, ...state.feed].slice(0, CONFIG.FEED_VISIBLE * 2),
    globalBestScore: isGlobalBest ? event.score : state.globalBestScore,
    flashSubmissionId: submissionId,
  };

  if (isGlobalBest) {
    next = { ...next, flashBestId: submissionId };
  }

  return {
    ...next,
    _pendingSound: isGlobalBest ? 'globalBest' : isParticipantBest ? 'teamBest' : 'push',
  };
}

export function dashboardReducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case ACTIONS.PUSH_EVENT: {
      const next = handlePushEvent(state, action.payload);
      const { _pendingSound: _, ...rest } = next as ReducerState;
      return rest;
    }
    case ACTIONS.TICK_COUNTDOWN:
      return { ...state, countdownRemaining: Math.max(0, state.countdownRemaining - 1) };
    case ACTIONS.TOGGLE_SOUND:
      return { ...state, soundEnabled: !state.soundEnabled };
    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case ACTIONS.RESET:
      return createInitialState();
    case ACTIONS.CLEANUP_FEED:
      return {
        ...state,
        feed: state.feed.map((item) =>
          action.payload.includes(item.id) ? { ...item, fading: true } : item,
        ),
      };
    case ACTIONS.SET_FLASH:
      return { ...state, flashSubmissionId: action.payload };
    case ACTIONS.SET_FLASH_BEST:
      return { ...state, flashBestId: action.payload };
    default:
      return state;
  }
}

export function applyPushEvents(
  initial: DashboardState,
  events: PushEvent[],
  { silent = false }: { silent?: boolean } = {},
): DashboardState {
  let state = initial;
  for (const event of events) {
    if (event.score == null) continue;
    const next = handlePushEvent(state, event);
    if (!silent) {
      state = next;
    } else {
      const { _pendingSound: _, flashSubmissionId: __, flashBestId: __b, ...rest } = next as ReducerState;
      state = { ...rest, flashSubmissionId: null, flashBestId: null };
    }
  }
  return state;
}
