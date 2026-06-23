'use client';

import { CONFIG } from '@/lib/config';
import { formatScore } from '@/lib/to-event';
import type { Submission } from '@/lib/types';

function FeedRow({ item }: { item: Submission }) {
  return (
    <div className="feed-row feed-slide">
      <span className="feed-dot" />
      <span className="feed-participant">{item.participantName}</span>
      <span className="feed-exp mono">{item.experiment}</span>
      <span className="feed-model mono">{item.model}</span>
      <span className="feed-score mono">{formatScore(item.score)}</span>
      <span className="feed-num mono">#{item.submissionNumber}</span>
    </div>
  );
}

interface ActivityFeedProps {
  submissions: Submission[];
}

export default function ActivityFeed({ submissions }: ActivityFeedProps) {
  const visible = [...submissions]
    .sort((a, b) => b.reportNumericId - a.reportNumericId)
    .slice(0, CONFIG.FEED_VISIBLE);

  return (
    <section className="activity-feed">
      <div className="feed-chrome">
        <div className="traffic-lights">
          <span className="tl tl-red" />
          <span className="tl tl-yellow" />
          <span className="tl tl-green" />
        </div>
        <span className="feed-repo mono">{CONFIG.REPO_SLUG}</span>
        <span className="feed-live">
          <span className="live-dot" />
          LIVE
        </span>
      </div>

      <div className="feed-list">
        {visible.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
        {!visible.length && (
          <div className="feed-empty">Waiting for Skore pushes from the workshop repo…</div>
        )}
      </div>

      <style jsx>{`
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
        .feed-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .feed-row {
          display: grid;
          grid-template-columns: 12px 88px 88px 1fr 64px 40px;
          gap: 8px;
          align-items: center;
          padding: 10px 8px;
          font-size: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .feed-participant { font-weight: 600; }
        .feed-exp { color: #c8cade; }
        .feed-model { color: #c8cade; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .feed-score { color: var(--sky); }
        .feed-num { color: #9a9cb8; }
        .feed-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5a5c7a;
        }
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
