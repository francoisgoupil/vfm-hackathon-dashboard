import { useEffect } from 'react';
import { CONFIG } from '../config';

function SnippetCard({ lastPush }) {
  if (!lastPush) return null;

  return (
    <div className="snippet-card mono">
      <span className="snippet-fn">project.put(</span>
      <span className="snippet-str">"{lastPush.model}"</span>
      <span className="snippet-fn">, report)</span>
      <div className="snippet-meta">
        → {lastPush.skill ?? 'iterate-from-skore'} @ {lastPush.llm ?? 'agent'}
      </div>
    </div>
  );
}

function FeedRow({ item }) {
  const shortTeam = item.teamName.replace('Team ', '');

  return (
    <div
      className={`feed-row ${item.fading ? 'feed-fade' : 'feed-slide'} ${
        item.isGlobalBest ? 'feed-global' : item.isTeamBest ? 'feed-team' : ''
      }`}
    >
      <span className="feed-dot" />
      <span className="feed-team">{shortTeam}</span>
      <span className="feed-model mono">{item.model}</span>
      <span className="feed-mae mono">{item.mae.toFixed(2)}</span>
      <span className="feed-tx mono">{item.transformer ?? '—'}</span>
      <span className="feed-agent mono">
        {item.skill ?? '—'} / {item.llm ?? '—'}
      </span>
      {item.isGlobalBest && <span className="feed-tag tag-orange">NEW BEST</span>}
    </div>
  );
}

export default function ActivityFeed({ feed, lastPush, onCleanup }) {
  useEffect(() => {
    if (!feed.length) return undefined;

    const timers = feed.slice(0, CONFIG.FEED_VISIBLE).map((item) =>
      setTimeout(() => onCleanup([item.id]), 30000),
    );

    return () => timers.forEach(clearTimeout);
  }, [feed, onCleanup]);

  const visible = feed.slice(0, CONFIG.FEED_VISIBLE);

  return (
    <section className="activity-feed">
      <div className="feed-chrome">
        <div className="traffic-lights">
          <span className="tl tl-red" />
          <span className="tl tl-yellow" />
          <span className="tl tl-green" />
        </div>
        <span className="feed-repo mono">probabl-ai/vfm-hackathon</span>
        <span className="feed-live">
          <span className="live-dot" />
          LIVE
        </span>
      </div>

      <SnippetCard lastPush={lastPush} />

      <div className="feed-list">
        {visible.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
        {!visible.length && <div className="feed-empty">Waiting for pushes…</div>}
      </div>

      <style>{`
        .activity-feed {
          background: var(--feed-bg);
          color: var(--bone);
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .feed-chrome {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-size: 12px;
        }
        .traffic-lights {
          display: flex;
          gap: 6px;
        }
        .tl {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .tl-red { background: #ff5f57; }
        .tl-yellow { background: #febc2e; }
        .tl-green { background: #28c840; }
        .feed-repo { color: #9a9cb8; flex: 1; }
        .feed-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          color: var(--sky);
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sky);
          animation: pulse 1.4s ease infinite;
        }
        .snippet-card {
          margin: 16px 20px 12px;
          padding: 14px 16px;
          background: var(--midnight-3);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius);
          font-size: 13px;
          line-height: 1.5;
        }
        .snippet-str { color: var(--sky); }
        .snippet-fn { color: #c8cade; }
        .snippet-meta {
          margin-top: 8px;
          font-size: 11px;
          color: var(--orange);
        }
        .feed-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 16px;
        }
        .feed-row {
          display: grid;
          grid-template-columns: 12px 72px 1fr 56px 100px 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 10px 8px;
          border-left: 3px solid transparent;
          font-size: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .feed-team { font-weight: 600; }
        .feed-model { color: #c8cade; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-mae { color: var(--sky); }
        .feed-tx { color: #9a9cb8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-agent { color: #9a9cb8; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5a5c7a;
        }
        .feed-team-best {
          border-left-color: var(--sky);
        }
        .feed-team { border-left-color: transparent; }
        .feed-row.feed-team { border-left-color: var(--sky); }
        .feed-row.feed-global { border-left-color: var(--orange); }
        .feed-tag { margin-left: 4px; }
        .feed-empty {
          padding: 24px;
          text-align: center;
          color: #9a9cb8;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}
