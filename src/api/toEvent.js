import { CONFIG } from '../config';

function resolveTeamName(project) {
  const slug = project.name ?? project.id;
  if (CONFIG.PROJECT_TO_TEAM[slug]) return CONFIG.PROJECT_TO_TEAM[slug];

  const lower = String(slug).toLowerCase();
  for (const [key, team] of Object.entries(CONFIG.PROJECT_TO_TEAM)) {
    if (key.toLowerCase() === lower) return team;
  }
  for (const team of CONFIG.TEAMS) {
    if (team.toLowerCase().includes(lower)) return team;
  }
  return slug;
}

export function firstNonEstimatorStep(steps = []) {
  if (!steps?.length) return null;
  const suffixes = CONFIG.ESTIMATOR_SUFFIXES;
  for (const step of steps) {
    const name = typeof step === 'string' ? step : step?.name ?? String(step);
    if (!suffixes.some((s) => name.includes(s))) {
      return name;
    }
  }
  return steps[steps.length - 1] ?? null;
}

function maeFromKey(key) {
  if (!key) return null;
  const match = String(key).match(/@mae=([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1]) : null;
}

export function toEvent(report, project) {
  const teamName = resolveTeamName(project);
  const runKey = report.key ?? null;

  return {
    teamName,
    model: report.estimator_name ?? runKey ?? 'Unknown',
    transformer: firstNonEstimatorStep(report.steps),
    mae:
      report.metrics?.mean_absolute_error?.mean ??
      report.metrics?.mae?.mean ??
      maeFromKey(runKey),
    r2: report.metrics?.r2?.mean ?? null,
    llm: report.metadata?.llm ?? CONFIG.TEAM_LLMS[teamName] ?? null,
    skill: report.metadata?.skill ?? null,
    reportId: report.urn ?? report.id,
    ts: new Date(report.created_at).getTime(),
  };
}
