import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  getSkoreConfig,
  listWorkspaceProjects,
  listProjectReports,
  getProjectReport,
} from './skore.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/health', (_req, res) => {
  const { SKORE_WORKSPACE_ID, SKORE_API_KEY } = getSkoreConfig();
  res.json({
    ok: true,
    workspace: SKORE_WORKSPACE_ID ?? null,
    hasKey: Boolean(SKORE_API_KEY),
  });
});

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await listWorkspaceProjects();
    res.json(projects);
  } catch (err) {
    console.error('[projects]', err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  const { project } = req.query;
  if (!project) {
    return res.status(400).json({ error: 'project query param required' });
  }

  try {
    const reports = await listProjectReports(project);
    res.json(reports);
  } catch (err) {
    console.error('[reports]', project, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/reports/:project/:reportId', async (req, res) => {
  const { project, reportId } = req.params;

  try {
    const report = await getProjectReport(project, reportId);
    res.json(report);
  } catch (err) {
    console.error('[report]', project, reportId, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.use(express.static('dist'));

app.get('*', (_req, res) => {
  res.sendFile('index.html', { root: 'dist' }, (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

app.listen(PORT, () => {
  console.log(`Skore proxy listening on http://localhost:${PORT}`);
});
