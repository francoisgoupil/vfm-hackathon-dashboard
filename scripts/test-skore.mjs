import {
  getSkoreConfig,
  listWorkspaceProjects,
  listProjectReports,
  maeFromKey,
} from '../server/skore.js';

const { SKORE_API_KEY: key, SKORE_WORKSPACE_ID } = getSkoreConfig();

if (!key || key.length < 40 || key === 'sk_workspace_xxxx') {
  console.error('Set SKORE_API_KEY in .env — wrap the value in quotes if it contains : / + =');
  console.error('(Save the file after editing; unsaved changes are not picked up.)');
  process.exit(1);
}
if (!SKORE_WORKSPACE_ID) {
  console.error('Missing SKORE_WORKSPACE_ID in .env');
  process.exit(1);
}

try {
  console.log(`Workspace: ${SKORE_WORKSPACE_ID}`);
  console.log(`API base:  ${process.env.SKORE_API_BASE || 'https://api.skore.probabl.ai'}`);
  console.log('Auth:      X-API-Key (see api.skore.probabl.ai/docs)');

  const projects = await listWorkspaceProjects();
  console.log(`\nProjects (${projects.length}):`);

  if (!projects.length) {
    console.log('  (none yet — create projects in Skore Hub first)');
  }

  for (const p of projects) {
    console.log(`  - ${p.name}`);
    try {
      const reports = await listProjectReports(p.name);
      const withMae = reports.filter((r) => r.metrics?.mae?.mean != null);
      console.log(`      ${reports.length} report(s), ${withMae.length} with MAE`);
      if (reports[0]) {
        const latest = reports[reports.length - 1];
        const m = latest.metrics;
        const mae = m?.mae?.mean ?? m?.mean_absolute_error?.mean;
        const r2 = m?.r2?.mean;
        const maeSource =
          mae != null && maeFromKey(latest.key) === mae ? 'key' : mae != null ? 'hub' : '—';
        console.log(
          `      latest: ${latest.estimator_name} key=${latest.key ?? '—'} MAE=${mae ?? '—'} (${maeSource}) R²=${r2 ?? '—'}`,
        );
      }
    } catch (err) {
      console.log(`      reports error: ${err.message}`);
    }
  }

  console.log('\nConnection OK — restart with: npm run dev');
} catch (err) {
  console.error('\nConnection failed:', err.message);
  if (String(err.message).includes('401')) {
    console.error('Tip: regenerate a workspace API key at https://skore.probabl.ai/account');
    console.error('     Quote the key in .env: SKORE_API_KEY="sk_workspace_..."');
    console.error('     Skore Python uses SKORE_HUB_API_KEY (same value works).');
  }
  process.exit(1);
}
