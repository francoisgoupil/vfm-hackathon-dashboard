import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';
import { CONFIG } from '../config';

function Sparkline({ data }) {
  const points = data.map((v, i) => ({ i, v }));
  if (!points.length) return <div className="spark-empty" />;

  return (
    <ResponsiveContainer width="100%" height={28}>
      <LineChart data={points}>
        <Line
          type="monotone"
          dataKey="v"
          stroke="var(--persian)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Delta({ current, prev }) {
  if (prev == null || current == null) return <span className="delta mono">—</span>;
  const diff = current - prev;
  if (Math.abs(diff) < 0.01) return <span className="delta mono">—</span>;
  const improving = diff < 0;
  return (
    <span className={`delta mono ${improving ? 'delta-down' : 'delta-up'}`}>
      {improving ? '↓' : '↑'} {Math.abs(diff).toFixed(2)}
    </span>
  );
}

function ProgressBar({ best, globalBestMae }) {
  const max = 30;
  const pct = best != null ? Math.max(4, ((max - best) / max) * 100) : 0;
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function LeaderboardRow({ team, rank, isFirst, flash, globalBestMae }) {
  const shortName = team.name.replace('Team ', '');

  return (
    <tr className={`lb-row ${isFirst ? 'lb-first' : ''} ${flash ? 'flash-row' : ''}`}>
      <td className="lb-rank mono">{rank}</td>
      <td className="lb-team">
        <div className="lb-team-name">{shortName}</div>
        <div className="lb-team-meta mono">
          {team.model ?? '—'}
          {team.llm && (
            <span className="lb-llm">
              {' '}
              · {team.llm}
              {team.skill ? ` · ${team.skill}` : ''}
            </span>
          )}
        </div>
      </td>
      <td className="lb-mae">
        <div className="lb-mae-row">
          <span className="mono mae-current">{team.currentMae?.toFixed(2) ?? '—'}</span>
          <Delta current={team.currentMae} prev={team.prevMae} />
        </div>
        <ProgressBar best={team.bestMae} globalBestMae={globalBestMae} />
        <div className="lb-best mono">best {team.bestMae?.toFixed(2) ?? '—'}</div>
      </td>
      <td className="lb-spark">
        <Sparkline data={team.maeHistory} />
      </td>
      <td className="lb-pushes mono">{team.pushCount}</td>
      <td className="lb-streak">
        {team.streak >= CONFIG.STREAK_MIN && (
          <span className="streak-badge">
            <Flame size={14} strokeWidth={1.5} />
            STREAK ×{team.streak}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function Leaderboard({ teams, leaderboard, flashTeam, globalBestMae }) {
  return (
    <section className="leaderboard">
      <div className="lb-header">
        <h2 className="serif">Leaderboard</h2>
        <span className="lb-hint">Ranked by MAE (lower is better)</span>
      </div>

      <table className="lb-table">
        <thead>
          <tr className="mono lb-head-row">
            <th>#</th>
            <th>Team / model</th>
            <th>MAE</th>
            <th>Trend</th>
            <th>Pushes</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((name, i) => (
            <LeaderboardRow
              key={name}
              team={teams[name]}
              rank={i + 1}
              isFirst={i === 0}
              flash={flashTeam === name}
              globalBestMae={globalBestMae}
            />
          ))}
        </tbody>
      </table>

      <style>{`
        .leaderboard {
          padding: 20px 28px;
          min-height: 0;
          overflow: hidden;
          border-right: 1px solid var(--border);
        }
        .lb-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 14px;
        }
        .lb-header h2 {
          margin: 0;
          font-size: 22px;
        }
        .lb-hint {
          font-size: 12px;
          color: var(--text-muted);
        }
        .lb-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .lb-head-row th {
          text-align: left;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
          padding: 0 10px 10px;
          border-bottom: 1px solid var(--border);
        }
        .lb-row {
          transition: background var(--t-slow) var(--ease), transform var(--t-slow) var(--ease);
        }
        .lb-row td {
          padding: 14px 10px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .lb-first {
          background: rgba(248, 152, 56, 0.08);
          box-shadow: inset 4px 0 0 var(--orange);
        }
        .lb-first .lb-rank { color: var(--orange); }
        .lb-rank {
          width: 40px;
          font-size: 20px;
        }
        .lb-team-name {
          font-weight: 600;
          font-size: 16px;
        }
        .lb-team-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 3px;
        }
        .lb-llm { color: var(--text-muted); }
        .lb-mae-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mae-current { font-size: 18px; }
        .delta { font-size: 12px; }
        .lb-best {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .progress-track {
          height: 3px;
          background: var(--surface-2);
          border-radius: 2px;
          margin: 6px 0;
          position: relative;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--persian);
          border-radius: 2px;
          transition: width var(--t-slow) var(--ease);
        }
        .lb-first .progress-fill { background: var(--orange); }
        .lb-spark { width: 120px; }
        .spark-empty {
          height: 28px;
          background: var(--surface-2);
          border-radius: 2px;
          opacity: 0.4;
        }
        .lb-pushes { font-size: 16px; }
        .streak-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--orange);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
        }
      `}</style>
    </section>
  );
}
