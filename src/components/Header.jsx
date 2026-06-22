import { Volume2, VolumeX } from 'lucide-react';
import ProbablWordmark from './ProbablWordmark';

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Header({ countdownRemaining, soundEnabled, onToggleSound, theme }) {
  const urgent = countdownRemaining <= 300;

  return (
    <header className="header">
      <div className="header-left">
        <ProbablWordmark theme={theme} />
      </div>

      <div className="header-center">
        <h1 className="header-title serif">Virtual Flow Metering Hackathon</h1>
        <p className="header-sub">TotalEnergies × Probabl · 5 teams</p>
      </div>

      <div className="header-right">
        <div className={`countdown mono ${urgent ? 'urgent' : ''}`}>{formatTime(countdownRemaining)}</div>
        <button
          className="sound-btn"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? <Volume2 size={22} strokeWidth={1.5} /> : <VolumeX size={22} strokeWidth={1.5} />}
        </button>
      </div>

      <style>{`
        .header {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          align-items: center;
          padding: 0 32px;
          height: 88px;
          border-bottom: 1px solid var(--border);
        }
        .header-left { justify-self: start; }
        .header-center { text-align: center; }
        .header-right {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.1;
        }
        .header-sub {
          margin: 4px 0 0;
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .countdown {
          font-size: 42px;
          letter-spacing: -0.03em;
          transition: color var(--t-med) var(--ease);
        }
        .countdown.urgent { color: var(--orange); }
        .sound-btn {
          color: var(--text-muted);
          padding: 8px;
          border-radius: var(--radius);
          transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
        }
        .sound-btn:hover {
          color: var(--text);
          background: var(--surface-2);
        }
      `}</style>
    </header>
  );
}
