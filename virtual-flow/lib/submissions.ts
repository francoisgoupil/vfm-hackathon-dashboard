import { CONFIG } from './config';
import type { Submission } from './types';

export function parseReportNumericId(reportId: string | number | null | undefined): number {
  if (reportId == null) return 0;
  const direct = Number(reportId);
  if (!Number.isNaN(direct) && String(reportId).match(/^\d+$/)) return direct;
  const match = String(reportId).match(/:(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export function computeScoreRanks(submissions: Submission[]): Map<string, number> {
  const sorted = [...submissions].sort((a, b) =>
    CONFIG.SCORE_HIGHER_IS_BETTER ? b.score - a.score : a.score - b.score,
  );
  const ranks = new Map<string, number>();
  sorted.forEach((s, i) => ranks.set(s.id, i + 1));
  return ranks;
}

export function bestSubmission(submissions: Submission[]): Submission | null {
  if (!submissions.length) return null;
  return submissions.reduce<Submission | null>((best, s) => {
    if (!best) return s;
    const better = CONFIG.SCORE_HIGHER_IS_BETTER ? s.score > best.score : s.score < best.score;
    return better ? s : best;
  }, null);
}

export type TableSortMode = 'id' | 'rank';

export function sortSubmissions(submissions: Submission[], mode: TableSortMode): Submission[] {
  const rows = [...submissions];
  if (mode === 'id') {
    rows.sort((a, b) => b.reportNumericId - a.reportNumericId);
  } else {
    rows.sort((a, b) => {
      if (a.score !== b.score) {
        return CONFIG.SCORE_HIGHER_IS_BETTER ? b.score - a.score : a.score - b.score;
      }
      return b.reportNumericId - a.reportNumericId;
    });
  }
  return rows;
}
