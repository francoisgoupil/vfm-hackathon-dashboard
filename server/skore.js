import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function env() {
  return {
    SKORE_API_BASE: process.env.SKORE_API_BASE || 'https://api.skore.probabl.ai',
    SKORE_API_KEY: process.env.SKORE_API_KEY || process.env.SKORE_HUB_API_KEY,
    SKORE_WORKSPACE_ID: process.env.SKORE_WORKSPACE_ID,
  };
}

export function getSkoreConfig() {
  return env();
}

function metricMap(metrics = []) {
  const out = {};
  for (const m of metrics) {
    if (m.data_source != null && m.data_source !== 'test') continue;
    out[m.name] = m.value;
  }
  return out;
}

/** Hub only serializes built-in metrics (R², RMSE…). Custom MAE → encode in put key: `rf-v1@mae=12.34` */
export function maeFromKey(key) {
  if (!key) return null;
  const match = String(key).match(/@mae=([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1]) : null;
}

function resolveMae(metrics, key) {
  const fromHub =
    metrics.mae ?? metrics.mean_absolute_error ?? metrics.mae_mean ?? null;
  if (fromHub != null) return fromHub;
  return maeFromKey(key);
}

function reportIdFromUrn(urn) {
  if (!urn) return null;
  const match = String(urn).match(/:(\d+)$/);
  return match ? match[1] : urn;
}

export function normalizeProjects(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') return { id: item, name: item };
      const slug = item.name ?? item.slug ?? item.public_id ?? String(item.id);
      return {
        id: String(slug),
        name: String(slug),
        displayName: item.name ?? slug,
        created_at: item.created_at ?? null,
        estimator_report_count: item.estimator_report_count ?? null,
      };
    });
  }
  if (data?.projects) return normalizeProjects(data.projects);
  return [];
}

export function normalizeReportSummary(summary, reportType = 'estimator') {
  const metrics = metricMap(summary.metrics);
  const key = summary.key ?? null;
  const mae = resolveMae(metrics, key);
  const urn = summary.urn ?? (summary.id != null ? `skore:report:${reportType}:${summary.id}` : null);
  const id = reportIdFromUrn(urn) ?? summary.id;

  return {
    id,
    urn,
    created_at: summary.created_at ?? summary.date,
    estimator_name: summary.estimator_class_name ?? summary.learner ?? key,
    key,
    report_type: reportType,
    metrics: {
      mean_absolute_error: {
        mean: mae,
      },
      mae: {
        mean: mae,
      },
      r2: {
        mean: metrics.r2 ?? metrics.r2_mean ?? null,
      },
      rmse: {
        mean: metrics.rmse ?? metrics.rmse_mean ?? null,
      },
    },
    steps: summary.steps ?? [],
    metadata: summary.metadata ?? {},
  };
}

function authHeaders() {
  const { SKORE_API_KEY } = env();
  return {
    'X-API-Key': SKORE_API_KEY,
    Accept: 'application/json',
    'X-Skore-Client': 'vfm-hackathon-dashboard/1.0.0',
  };
}

export async function skoreFetch(urlPath, { method = 'GET', body = null } = {}) {
  const { SKORE_API_KEY, SKORE_API_BASE } = env();
  if (!SKORE_API_KEY) {
    throw new Error('SKORE_API_KEY (or SKORE_HUB_API_KEY) is not configured');
  }

  const headers = authHeaders();
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${SKORE_API_BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Skore API ${res.status}: ${text || res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Skore hub slug: lowercase ASCII letters, digits, . - _ */
export function slugifyProjectName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w.-]/g, '-')
    .replace(/[.]+/g, '.')
    .replace(/[-]+/g, '-')
    .replace(/[_]+/g, '_')
    .replace(/^[.-_]+|[.-_]+$/g, '');
}

export async function createProject(displayName) {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) {
    throw new Error('SKORE_WORKSPACE_ID is not configured');
  }
  const slug = slugifyProjectName(displayName);
  if (!slug) throw new Error(`Invalid project name: ${displayName}`);

  return skoreFetch(`/projects/${SKORE_WORKSPACE_ID}/${slug}`, { method: 'POST' });
}

export async function listWorkspaceProjects() {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) {
    throw new Error('SKORE_WORKSPACE_ID is not configured');
  }
  const data = await skoreFetch(`/projects/${SKORE_WORKSPACE_ID}`);
  return normalizeProjects(data);
}

export async function listProjectReports(projectName) {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) {
    throw new Error('SKORE_WORKSPACE_ID is not configured');
  }

  const reports = [];

  for (const [type, endpoint] of [
    ['estimator', 'estimator-reports'],
    ['cross-validation', 'cross-validation-reports'],
  ]) {
    try {
      const data = await skoreFetch(
        `/projects/${SKORE_WORKSPACE_ID}/${projectName}/${endpoint}`,
      );
      const list = Array.isArray(data) ? data : data?.reports ?? [];
      reports.push(...list.map((s) => normalizeReportSummary(s, type)));
    } catch (err) {
      if (!String(err.message).includes('404')) throw err;
    }
  }

  return reports.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export async function getProjectReport(projectName, reportId) {
  const { SKORE_WORKSPACE_ID } = env();
  const numericId = reportIdFromUrn(reportId) ?? reportId;

  for (const endpoint of ['estimator-reports', 'cross-validation-reports']) {
    try {
      const data = await skoreFetch(
        `/projects/${SKORE_WORKSPACE_ID}/${projectName}/${endpoint}/${numericId}`,
      );
      const type = endpoint.startsWith('estimator') ? 'estimator' : 'cross-validation';
      return normalizeReportSummary(data, type);
    } catch (err) {
      if (!String(err.message).includes('404')) throw err;
    }
  }

  throw new Error(`Report ${reportId} not found in project ${projectName}`);
}
