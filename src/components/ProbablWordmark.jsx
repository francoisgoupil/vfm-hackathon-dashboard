import { PROBABL_WORDMARK_URL } from '../config';

export default function ProbablWordmark({ theme }) {
  return (
    <div className="wordmark-wrap">
      <p className="wordmark-eyebrow">The scikit-learn company</p>
      <img
        src={PROBABL_WORDMARK_URL}
        alt="Probabl"
        className="wordmark-img"
        style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
      />
      <style>{`
        .wordmark-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .wordmark-eyebrow {
          margin: 0;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 500;
        }
        .wordmark-img {
          height: 28px;
          width: auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
