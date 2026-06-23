'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import {
  computeScoreRanks,
  sortSubmissions,
  type TableSortMode,
} from '@/lib/submissions';
import { formatScore, formatScoreDelta } from '@/lib/to-event';
import type { Submission } from '@/lib/types';

function Delta({ current, prev }: { current: number; prev: number | null }) {
  const delta = formatScoreDelta(current, prev);
  if (!delta) return <span className="delta mono">—</span>;
  return (
    <span className={`delta mono ${delta.improving ? 'delta-down' : 'delta-up'}`}>
      {delta.arrow} {delta.value}
    </span>
  );
}

function SubmissionRow({
  submission,
  rank,
  flash,
  isNew,
}: {
  submission: Submission;
  rank: number;
  flash: boolean;
  isNew: boolean;
}) {
  return (
    <tr className={`lb-row ${flash ? 'flash-row' : ''} ${isNew ? 'row-enter' : ''}`}>
      <td className="lb-id mono">{submission.reportNumericId || '—'}</td>
      <td className="lb-participant">{submission.participantName}</td>
      <td className="lb-submission">
        <div className="lb-submission-name">{submission.experiment}</div>
        <div className="lb-submission-meta mono">
          {submission.model} · {submission.reportType}
          {submission.hubKey && submission.hubKey !== submission.experiment && (
            <span className="lb-key"> · {submission.hubKey}</span>
          )}
        </div>
      </td>
      <td className="lb-score mono">{formatScore(submission.score)}</td>
      <td className="lb-delta">
        <Delta current={submission.score} prev={submission.prevScore} />
      </td>
      <td className="lb-sub-num mono">{submission.submissionNumber}</td>
      <td className={`lb-rank mono ${rank === 1 ? 'rank-first' : ''}`}>{rank}</td>
    </tr>
  );
}

interface LeaderboardProps {
  submissions: Submission[];
  flashSubmissionId: string | null;
}

export default function Leaderboard({ submissions, flashSubmissionId }: LeaderboardProps) {
  const [sortMode, setSortMode] = useState<TableSortMode>('id');
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const knownIds = useRef<Set<string> | null>(null);
  const ranks = useMemo(() => computeScoreRanks(submissions), [submissions]);
  const sorted = useMemo(() => sortSubmissions(submissions, sortMode), [submissions, sortMode]);

  if (knownIds.current === null) {
    knownIds.current = new Set(submissions.map((s) => s.id));
  }

  useEffect(() => {
    const fresh = new Set<string>();
    for (const s of submissions) {
      if (!knownIds.current!.has(s.id)) {
        fresh.add(s.id);
        knownIds.current!.add(s.id);
      }
    }
    if (!fresh.size) return undefined;
    setNewIds(fresh);
    const t = setTimeout(() => setNewIds(new Set()), 1200);
    return () => clearTimeout(t);
  }, [submissions]);

  return (
    <section className="leaderboard">
      <div className="lb-header">
        <h2 className="serif">Submissions</h2>
        <span className="lb-hint">
          {sortMode === 'id'
            ? 'Sorted by ID ↓'
            : `Sorted by ${CONFIG.SCORE_LABEL} ${CONFIG.SCORE_HIGHER_IS_BETTER ? '↓' : '↑'}`}
        </span>
      </div>

      <div className="lb-scroll">
        <table className="lb-table">
          <thead>
            <tr className="mono lb-head-row">
              <th className="lb-sort-head">
                <button
                  type="button"
                  className="sort-btn"
                  onClick={() => setSortMode((m) => (m === 'id' ? 'rank' : 'id'))}
                  title="Toggle sort: ID or rank"
                >
                  <ArrowDown size={12} />
                  <span>ID</span>
                </button>
              </th>
              <th>Participant</th>
              <th>Submission</th>
              <th>{CONFIG.SCORE_LABEL}</th>
              <th>Δ prev</th>
              <th>#sub</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="lb-empty">
                  Waiting for Skore reports — run a CV or private submit from total-workshop
                </td>
              </tr>
            )}
            {sorted.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                rank={ranks.get(submission.id) ?? 0}
                flash={flashSubmissionId === submission.id}
                isNew={newIds.has(submission.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
