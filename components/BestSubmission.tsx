'use client';

import { Trophy } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import { formatScore, formatScoreDelta } from '@/lib/to-event';
import type { Submission } from '@/lib/types';

function Delta({ submission }: { submission: Submission }) {
  const delta = formatScoreDelta(submission.score, submission.prevScore);
  if (!delta) return <span className="mono">—</span>;
  return (
    <span className={`mono ${delta.improving ? 'delta-down' : 'delta-up'}`}>
      {delta.arrow} {delta.value}
    </span>
  );
}

interface BestSubmissionProps {
  submission: Submission | null;
  flash?: boolean;
}

export default function BestSubmission({ submission, flash = false }: BestSubmissionProps) {
  return (
    <section className="best-panel">
      <div className={`best-inner ${flash ? 'best-flash' : ''}`}>
        <div className="best-label">
          <Trophy size={18} strokeWidth={1.5} />
          <span className="serif">Best submission</span>
          <span className="best-hint mono">
            {CONFIG.SCORE_LABEL} · {CONFIG.SCORE_HIGHER_IS_BETTER ? 'higher is better' : 'lower is better'}
          </span>
        </div>

        {!submission ? (
          <p className="best-empty">No submissions yet</p>
        ) : (
          <table className="best-table">
            <thead>
              <tr className="mono best-head">
                <th>ID</th>
                <th>Participant</th>
                <th>Submission</th>
                <th>{CONFIG.SCORE_LABEL}</th>
                <th>Δ prev</th>
                <th>#sub</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`best-row ${flash ? 'best-row-flash' : ''}`}>
                <td className="mono">{submission.reportNumericId}</td>
                <td className="best-participant">{submission.participantName}</td>
                <td>
                  <div className="best-exp">{submission.experiment}</div>
                  <div className="best-meta mono">
                    {submission.model} · {submission.reportType}
                  </div>
                </td>
                <td className="mono best-score">{formatScore(submission.score)}</td>
                <td><Delta submission={submission} /></td>
                <td className="mono">{submission.submissionNumber}</td>
                <td className="mono best-rank">1</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
