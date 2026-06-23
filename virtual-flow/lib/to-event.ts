import { CONFIG } from './config';
import type { NormalizedReport, PushEvent, SkoreProject } from './types';

/** Hub keys: `{username}/{stem}_private` or `{stem}` during CV. */
export function resolveParticipant(key: string | null, project: SkoreProject): string {
  if (key?.includes('/')) return key.split('/')[0];
  if (key) return key.replace(/_private$/, '');
  return project.displayName ?? project.name;
}

export function experimentLabel(key: string | null): string {
  if (!key) return '—';
  const slash = key.lastIndexOf('/');
  const stem = slash >= 0 ? key.slice(slash + 1) : key;
  return stem.replace(/_private$/, '');
}

export function toEvent(report: NormalizedReport, project: SkoreProject): PushEvent {
  const runKey = report.key ?? null;
  const participantName = resolveParticipant(runKey, project);

  return {
    participantName,
    experiment: experimentLabel(runKey),
    hubKey: runKey,
    model: report.estimator_name ?? runKey ?? 'Unknown',
    reportType: report.report_type,
    score: report.metrics?.score?.mean ?? null,
    rocAuc: report.metrics?.roc_auc?.mean ?? null,
    llm: report.metadata?.llm ?? null,
    skill: report.metadata?.skill ?? null,
    reportId: report.urn ?? report.id,
    ts: new Date(report.created_at).getTime(),
  };
}

export function formatScore(score: number | null): string {
  if (score == null) return '—';
  if (CONFIG.PRIMARY_SCORE === 'rmse') return score.toFixed(4);
  return CONFIG.SCORE_HIGHER_IS_BETTER && score <= 1
    ? score.toFixed(4)
    : score.toFixed(2);
}

/** Arrow = actual change direction; color = whether that change is an improvement. */
export function formatScoreDelta(
  current: number,
  prev: number | null,
): { arrow: '↑' | '↓'; value: string; improving: boolean } | null {
  if (prev == null) return null;
  const diff = current - prev;
  if (Math.abs(diff) < 0.0001) return null;
  const improving = CONFIG.SCORE_HIGHER_IS_BETTER ? diff > 0 : diff < 0;
  return {
    arrow: diff > 0 ? '↑' : '↓',
    value: Math.abs(diff).toFixed(4),
    improving,
  };
}
