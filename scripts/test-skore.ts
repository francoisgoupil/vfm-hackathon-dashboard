import {
  getSkoreConfig,
  listWorkspaceProjects,
  listProjectReports,
} from '../lib/skore';
import { formatScore } from '../lib/to-event';

async function main() {
  const { SKORE_API_KEY: key, SKORE_WORKSPACE_ID } = getSkoreConfig();

  if (!key || key.length < 20 || key === 'sk_workspace_xxxx') {
    console.error('Set SKORE_API_KEY in .env — wrap the value in quotes if it contains : / + =');
    process.exit(1);
  }
  if (!SKORE_WORKSPACE_ID) {
    console.error('Missing SKORE_WORKSPACE_ID in .env');
    process.exit(1);
  }

  console.log(`Workspace: ${SKORE_WORKSPACE_ID}`);
  console.log(`API base:  ${process.env.SKORE_API_BASE || 'https://api.skore.probabl.ai'}`);

  const projects = await listWorkspaceProjects();
  console.log(`\nProjects (${projects.length}):`);

  if (!projects.length) {
    console.log('  (none — check SKORE_WORKSPACE_ID, e.g. ibm-workshop/dev)');
  }

  for (const p of projects) {
    console.log(`  - ${p.name}`);
    try {
      const reports = await listProjectReports(p.name);
      const withScore = reports.filter((r) => r.metrics?.score?.mean != null);
      console.log(`      ${reports.length} report(s), ${withScore.length} with score`);
      if (reports.length) {
        const latest = reports[reports.length - 1];
        const score = latest.metrics?.score?.mean;
        const roc = latest.metrics?.roc_auc?.mean;
        console.log(
          `      latest: [${latest.report_type}] ${latest.key} ${latest.estimator_name} score=${formatScore(score)} roc_auc=${formatScore(roc)}`,
        );
      }
    } catch (err) {
      console.log(`      reports error: ${(err as Error).message}`);
    }
  }

  console.log('\nConnection OK — run: pnpm dev');
}

main().catch((err) => {
  console.error('\nConnection failed:', err.message);
  process.exit(1);
});
