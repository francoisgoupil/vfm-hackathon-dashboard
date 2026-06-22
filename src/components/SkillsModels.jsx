import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { CONFIG } from '../config';

export default function SkillsModels({ modelCounts, transformerCounts }) {
  const models = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, CONFIG.TOP_MODELS)
    .map(([name, count], i) => ({ name, count, rank: i }));

  const maxTx = Math.max(1, ...Object.values(transformerCounts));
  const transformers = Object.entries(transformerCounts).sort((a, b) => b[1] - a[1]);

  return (
    <section className="skills-models">
      <div className="sm-models">
        <h3 className="serif sm-title">Top models</h3>
        <div className="sm-chart">
          {models.length ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={models} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]} isAnimationActive animationDuration={420}>
                  {models.map((entry) => (
                    <Cell key={entry.name} fill={entry.rank === 0 ? 'var(--orange)' : 'var(--persian)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="sm-empty">No models yet</div>
          )}
        </div>
      </div>

      <div className="sm-transformers">
        <h3 className="serif sm-title">Transformers</h3>
        <div className="tx-cloud">
          {transformers.map(([name, count]) => {
            const scale = 0.75 + (count / maxTx) * 0.75;
            const underline =
              count >= maxTx * 0.7 ? 'var(--orange)' : count >= maxTx * 0.4 ? 'var(--sky)' : 'transparent';

            return (
              <span
                key={name}
                className="tx-tag mono"
                style={{
                  fontSize: `${12 * scale}px`,
                  borderBottomColor: underline,
                }}
              >
                {name}
                <sup className="tx-count">{count}</sup>
              </span>
            );
          })}
          {!transformers.length && <span className="sm-empty">No transformers yet</span>}
        </div>
      </div>

      <style>{`
        .skills-models {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 20px 32px;
          border-top: 1px solid var(--border);
          min-height: 0;
        }
        .sm-title {
          margin: 0 0 12px;
          font-size: 18px;
        }
        .sm-chart { height: 120px; }
        .sm-empty {
          color: var(--text-muted);
          font-size: 13px;
          padding: 20px 0;
        }
        .tx-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          align-items: baseline;
          min-height: 80px;
        }
        .tx-tag {
          border-bottom: 2px solid transparent;
          padding-bottom: 2px;
          color: var(--text);
          transition: border-color var(--t-slow) var(--ease), font-size var(--t-slow) var(--ease);
        }
        .tx-count {
          font-size: 9px;
          color: var(--text-muted);
          margin-left: 2px;
        }
      `}</style>
    </section>
  );
}
