import {
  createProject,
  getSkoreConfig,
  listWorkspaceProjects,
  slugifyProjectName,
} from '../server/skore.js';

const TEAMS = [
  { displayName: 'Pression', team: 'Team Pression' },
  { displayName: 'Débit', team: 'Team Débit' },
  { displayName: 'Vanne', team: 'Team Vanne' },
  { displayName: 'Choke', team: 'Team Choke' },
  { displayName: 'Capteur', team: 'Team Capteur' },
];

const { SKORE_WORKSPACE_ID, SKORE_API_KEY } = getSkoreConfig();

if (!SKORE_API_KEY) {
  console.error('Set SKORE_API_KEY in .env');
  process.exit(1);
}
if (!SKORE_WORKSPACE_ID) {
  console.error('Set SKORE_WORKSPACE_ID in .env');
  process.exit(1);
}

console.log(`Workspace: ${SKORE_WORKSPACE_ID}\n`);

const existing = await listWorkspaceProjects();
const existingSlugs = new Set(existing.map((p) => p.name));

for (const { displayName, team } of TEAMS) {
  const slug = slugifyProjectName(displayName);

  if (existingSlugs.has(slug)) {
    console.log(`✓ ${team} — project "${slug}" already exists`);
    continue;
  }

  try {
    const result = await createProject(displayName);
    const url = result?.url ?? result?.frontend_url ?? '';
    console.log(`+ ${team} — created project "${slug}"${url ? ` → ${url}` : ''}`);
    existingSlugs.add(slug);
  } catch (err) {
    if (String(err.message).includes('409') || String(err.message).includes('already')) {
      console.log(`✓ ${team} — project "${slug}" already exists`);
    } else {
      console.error(`✗ ${team} — failed to create "${slug}": ${err.message}`);
    }
  }
}

console.log('\nDone. Run npm run test:skore to verify.');
