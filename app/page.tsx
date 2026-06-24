import { fetchDashboardSnapshot } from '@/lib/leaderboard';
import { bestSubmission } from '@/lib/submissions';
import Header from '@/components/Header';
import DashboardLive from '@/components/DashboardLive';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { initialState, meta } = await fetchDashboardSnapshot();
  const best = bestSubmission(initialState.submissions);

  return (
    <div className="dashboard" data-theme="light">
      <Header />
      <DashboardLive initialState={initialState} initialBest={best} skoreMeta={meta} />
    </div>
  );
}
