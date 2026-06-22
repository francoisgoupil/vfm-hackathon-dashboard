import { CONFIG } from './config';

export const ACTIONS = {
  PUSH_EVENT: 'PUSH_EVENT',
  TICK_COUNTDOWN: 'TICK_COUNTDOWN',
  TOGGLE_SOUND: 'TOGGLE_SOUND',
  TOGGLE_THEME: 'TOGGLE_THEME',
  RESET: 'RESET',
  DISMISS_BADGE: 'DISMISS_BADGE',
  CLEANUP_FEED: 'CLEANUP_FEED',
  SET_FLASH: 'SET_FLASH',
};

function emptyTeam(name) {
  return {
    name,
    currentMae: null,
    bestMae: null,
    prevMae: null,
    maeHistory: [],
    pushCount: 0,
    streak: 0,
    recentPushes: [],
    model: null,
    transformer: null,
    llm: CONFIG.TEAM_LLMS[name] ?? null,
    skill: null,
    rank: 0,
    prevRank: 0,
  };
}

function initTeams() {
  const teams = {};
  CONFIG.TEAMS.forEach((name) => {
    teams[name] = emptyTeam(name);
  });
  return teams;
}

export function createInitialState() {
  return {
    teams: initTeams(),
    leaderboard: [...CONFIG.TEAMS],
    feed: [],
    globalBestMae: Infinity,
    globalBestTeam: null,
    badges: [],
    achievedMaeThresholds: [],
    achievedEstimatorMilestones: {},
    soundEnabled: false,
    theme: 'light',
    countdownRemaining: CONFIG.COUNTDOWN_SEC,
    flashTeam: null,
    modelCounts: {},
    transformerCounts: {},
    lastPush: null,
  };
}

function computeStreak(recentPushes, now) {
  const windowStart = now - CONFIG.STREAK_WINDOW_MS;
  const inWindow = recentPushes.filter((t) => t >= windowStart);
  return inWindow.length >= CONFIG.STREAK_MIN ? inWindow.length : 0;
}

function sortLeaderboard(teams) {
  return [...CONFIG.TEAMS].sort((a, b) => {
    const maeA = teams[a].bestMae ?? Infinity;
    const maeB = teams[b].bestMae ?? Infinity;
    if (maeA !== maeB) return maeA - maeB;
    return a.localeCompare(b);
  });
}

function addBadge(state, badge) {
  return {
    ...state,
    badges: [...state.badges, { ...badge, id: `${badge.type}-${Date.now()}-${Math.random()}` }],
  };
}

function checkMaeThresholds(state, mae) {
  let next = state;
  for (const threshold of CONFIG.MAE_THRESHOLDS) {
    if (mae < threshold && !next.achievedMaeThresholds.includes(threshold)) {
      next = addBadge(next, {
        type: 'mae-threshold',
        label: `MAE below ${threshold}`,
        detail: `A team dropped below ${threshold} kg/s`,
        threshold,
      });
      next = {
        ...next,
        achievedMaeThresholds: [...next.achievedMaeThresholds, threshold],
      };
    }
  }
  return next;
}

function checkEstimatorMilestones(state, teamName, pushCount) {
  let next = state;
  const achieved = { ...next.achievedEstimatorMilestones };
  const teamAchieved = new Set(achieved[teamName] ?? []);

  for (const milestone of CONFIG.ESTIMATOR_MILESTONES) {
    if (pushCount >= milestone && !teamAchieved.has(milestone)) {
      teamAchieved.add(milestone);
      next = addBadge(next, {
        type: 'estimator-milestone',
        label: `${pushCount} pushes`,
        detail: `${teamName} reached ${milestone} estimators`,
        teamName,
        milestone,
      });
    }
  }

  achieved[teamName] = [...teamAchieved];
  return { ...next, achievedEstimatorMilestones: achieved };
}

function handlePushEvent(state, event) {
  if (event.mae == null || Number.isNaN(event.mae)) return state;

  const team = state.teams[event.teamName];
  if (!team) return state;

  const now = event.ts || Date.now();
  const prevBest = team.bestMae;
  const isTeamBest = prevBest === null || event.mae < prevBest;
  const isGlobalBest = event.mae < state.globalBestMae;

  const recentPushes = [...team.recentPushes, now].slice(-50);
  const streak = computeStreak(recentPushes, now);

  const maeHistory = [...team.maeHistory, event.mae].slice(-CONFIG.SPARKLINE_POINTS);

  const updatedTeam = {
    ...team,
    currentMae: event.mae,
    prevMae: team.currentMae,
    bestMae: isTeamBest ? event.mae : team.bestMae,
    maeHistory,
    pushCount: team.pushCount + 1,
    streak,
    recentPushes,
    model: event.model,
    transformer: event.transformer,
    llm: event.llm ?? team.llm,
    skill: event.skill ?? team.skill,
  };

  const teams = { ...state.teams, [event.teamName]: updatedTeam };
  const prevRanks = {};
  state.leaderboard.forEach((name, i) => {
    prevRanks[name] = i + 1;
  });

  const leaderboard = sortLeaderboard(teams);
  leaderboard.forEach((name, i) => {
    teams[name] = { ...teams[name], prevRank: prevRanks[name] ?? i + 1, rank: i + 1 };
  });

  const climbed = leaderboard.find(
    (name) => teams[name].rank < teams[name].prevRank && teams[name].prevRank > 0,
  );

  const feedItem = {
    id: event.reportId || `${event.teamName}-${now}`,
    teamName: event.teamName,
    model: event.model,
    mae: event.mae,
    transformer: event.transformer,
    llm: event.llm,
    skill: event.skill,
    ts: now,
    isTeamBest,
    isGlobalBest,
    fading: false,
  };

  const feed = [feedItem, ...state.feed].slice(0, CONFIG.FEED_VISIBLE * 2);

  const modelCounts = { ...state.modelCounts };
  modelCounts[event.model] = (modelCounts[event.model] ?? 0) + 1;

  const transformerCounts = { ...state.transformerCounts };
  if (event.transformer) {
    transformerCounts[event.transformer] = (transformerCounts[event.transformer] ?? 0) + 1;
  }

  let next = {
    ...state,
    teams,
    leaderboard,
    feed,
    globalBestMae: isGlobalBest ? event.mae : state.globalBestMae,
    globalBestTeam: isGlobalBest ? event.teamName : state.globalBestTeam,
    flashTeam: climbed ?? null,
    modelCounts,
    transformerCounts,
    lastPush: {
      teamName: event.teamName,
      model: event.model,
      skill: event.skill,
      llm: event.llm,
    },
  };

  next = checkMaeThresholds(next, event.mae);
  next = checkEstimatorMilestones(next, event.teamName, updatedTeam.pushCount);

  if (isGlobalBest) {
    next = addBadge(next, {
      type: 'global-best',
      label: 'NEW GLOBAL BEST',
      detail: `${event.teamName} — MAE ${event.mae.toFixed(2)}`,
      teamName: event.teamName,
      mae: event.mae,
    });
  }

  return {
    ...next,
    _sound: isGlobalBest ? 'globalBest' : isTeamBest ? 'teamBest' : 'push',
  };
}

export function dashboardReducer(state, action) {
  switch (action.type) {
    case ACTIONS.PUSH_EVENT: {
      const next = handlePushEvent(state, action.payload);
      const { _sound, ...rest } = next;
      return { ...rest, _pendingSound: _sound };
    }

    case ACTIONS.TICK_COUNTDOWN:
      return {
        ...state,
        countdownRemaining: Math.max(0, state.countdownRemaining - 1),
      };

    case ACTIONS.TOGGLE_SOUND:
      return { ...state, soundEnabled: !state.soundEnabled };

    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };

    case ACTIONS.RESET:
      return createInitialState();

    case ACTIONS.DISMISS_BADGE:
      return {
        ...state,
        badges: state.badges.filter((b) => b.id !== action.payload),
      };

    case ACTIONS.CLEANUP_FEED:
      return {
        ...state,
        feed: state.feed.map((item) =>
          action.payload.includes(item.id) ? { ...item, fading: true } : item,
        ),
      };

    case ACTIONS.SET_FLASH:
      return { ...state, flashTeam: action.payload };

    default:
      return state;
  }
}
