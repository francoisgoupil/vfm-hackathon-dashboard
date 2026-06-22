import { useEffect } from 'react';
import { Trophy, Zap } from 'lucide-react';

function BadgeIcon({ type }) {
  if (type === 'global-best') return <Trophy size={20} strokeWidth={1.5} />;
  return <Zap size={20} strokeWidth={1.5} />;
}

export default function FloatingBadges({ badges, onDismiss }) {
  useEffect(() => {
    const timers = badges.map((badge) =>
      setTimeout(() => onDismiss(badge.id), 2000),
    );
    return () => timers.forEach(clearTimeout);
  }, [badges, onDismiss]);

  if (!badges.length) return null;

  const latest = badges[badges.length - 1];

  return (
    <div className="badge-overlay" key={latest.id}>
      <div className={`floating-badge ${latest.type === 'global-best' ? 'badge-global' : ''}`}>
        <BadgeIcon type={latest.type} />
        <div>
          <div className="badge-label">{latest.label}</div>
          <div className="badge-detail">{latest.detail}</div>
        </div>
      </div>

      <style>{`
        .badge-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 50;
        }
        .floating-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 28px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: 0 8px 40px rgba(4, 5, 36, 0.25);
          animation: badgePop 420ms var(--ease);
          color: var(--text);
        }
        .badge-global {
          border-color: var(--orange);
          color: var(--orange);
        }
        .badge-global .badge-detail { color: var(--text); }
        .badge-label {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .badge-detail {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
