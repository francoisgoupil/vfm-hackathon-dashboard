import type { NormalizedReport, ReportMetric, SkoreProject } from './types';
import { CONFIG } from './config';

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

interface WorkspaceRouting {
  /** GET /projects/{workspace} — list sibling projects */
  listPath: string;
  /** GET /projects/{path} — single project when id is workspace/project */
  combinedProjectPath: string | null;
}

function workspaceRouting(): WorkspaceRouting {
  const id = env().SKORE_WORKSPACE_ID ?? '';
  if (id.includes('/')) {
    const workspace = id.split('/')[0];
    return {
      listPath: `/projects/${workspace}`,
      combinedProjectPath: `/projects/${id}`,
    };
  }
  return { listPath: `/projects/${id}`, combinedProjectPath: null };
}

/** API base for report endpoints (no duplicate project segment). */
function projectReportsBase(projectName: string): string {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) throw new Error('SKORE_WORKSPACE_ID is not configured');

  if (SKORE_WORKSPACE_ID.includes('/')) {
    const leaf = SKORE_WORKSPACE_ID.split('/').pop();
    if (projectName === leaf || projectName === SKORE_WORKSPACE_ID) {
      return `/projects/${SKORE_WORKSPACE_ID}`;
    }
    return `/projects/${SKORE_WORKSPACE_ID}/${projectName}`;
  }
  return `/projects/${SKORE_WORKSPACE_ID}/${projectName}`;
}

function metricMap(metrics: ReportMetric[] = [], dataSource = 'test') {
  const out: Record<string, number> = {};
  for (const m of metrics) {
    if (m.data_source != null && m.data_source !== dataSource) continue;
    out[m.name] = m.value;
  }
  return out;
}

export function scoreFromKey(key: string | null | undefined): number | null {
  if (!key) return null;
  const maeMatch = String(key).match(/@mae=([0-9]+(?:\.[0-9]+)?)/i);
  if (maeMatch) return Number(maeMatch[1]);
  const aucMatch = String(key).match(/@roc[_-]?auc=([0-9]+(?:\.[0-9]+)?)/i);
  if (aucMatch) return Number(aucMatch[1]);
  return null;
}

export function resolvePrimaryScore(
  metrics: Record<string, number>,
  key: string | null,
  mlTask?: string,
): number | null {
  if (CONFIG.PRIMARY_SCORE === 'mae') {
    const mae = metrics.mae_mean ?? metrics.mae ?? metrics.mean_absolute_error ?? null;
    if (mae != null) return mae;
    if (key && /@mae=/i.test(key)) {
      const fromKey = scoreFromKey(key);
      if (fromKey != null) return fromKey;
    }
    return null;
  }

  const scoreMean = metrics.score_mean ?? metrics.score ?? null;
  if (scoreMean != null) return scoreMean;

  const roc = metrics.roc_auc_mean ?? metrics.roc_auc ?? null;
  if (roc != null) return roc;

  const accuracy = metrics.accuracy_mean ?? metrics.accuracy ?? null;
  if (accuracy != null && mlTask?.includes('classification')) return accuracy;

  const mae = metrics.mae_mean ?? metrics.mae ?? metrics.mean_absolute_error ?? null;
  if (mae != null) return mae;

  const r2 = metrics.r2_mean ?? metrics.r2 ?? null;
  if (r2 != null) return r2;

  return scoreFromKey(key);
}

function reportIdFromUrn(urn: string | null | undefined): string | null {
  if (!urn) return null;
  const match = String(urn).match(/:(\d+)$/);
  return match ? match[1] : urn;
}

interface RawProject {
  id?: number | string;
  name?: string;
  slug?: string;
  public_id?: string;
  created_at?: string;
  estimator_report_count?: number;
}

interface RawReportSummary {
  id?: number;
  urn?: string;
  key?: string;
  created_at?: string;
  date?: string;
  ml_task?: string;
  estimator_class_name?: string;
  learner?: string;
  metrics?: ReportMetric[];
  steps?: unknown[];
  metadata?: Record<string, string>;
}

export function normalizeProjects(data: unknown): SkoreProject[] {
  if (Array.isArray(data)) {
    return data.map((item: string | RawProject) => {
      if (typeof item === 'string') {
        return { id: item, name: item, displayName: item, created_at: null, estimator_report_count: null };
      }
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
  if (data && typeof data === 'object') {
    if ('projects' in data) return normalizeProjects((data as { projects: unknown }).projects);
    if ('name' in data) return normalizeProjects([data]);
  }
  return [];
}

export function normalizeReportSummary(
  summary: RawReportSummary,
  reportType: 'estimator' | 'cross-validation' = 'estimator',
): NormalizedReport {
  const metrics = metricMap(summary.metrics);
  const key = summary.key ?? null;
  const score = resolvePrimaryScore(metrics, key, summary.ml_task);
  const urn =
    summary.urn ??
    (summary.id != null ? `skore:report:${reportType}:${summary.id}` : null);
  const id = reportIdFromUrn(urn) ?? summary.id ?? null;

  return {
    id,
    urn,
    created_at: summary.created_at ?? summary.date ?? new Date().toISOString(),
    estimator_name: summary.estimator_class_name ?? summary.learner ?? key,
    key,
    ml_task: summary.ml_task ?? null,
    report_type: reportType,
    metrics: {
      score: { mean: score },
      roc_auc: { mean: metrics.roc_auc_mean ?? metrics.roc_auc ?? null },
      accuracy: { mean: metrics.accuracy_mean ?? metrics.accuracy ?? null },
      mae: { mean: metrics.mae_mean ?? metrics.mae ?? metrics.mean_absolute_error ?? null },
      r2: { mean: metrics.r2_mean ?? metrics.r2 ?? null },
      rmse: { mean: metrics.rmse_mean ?? metrics.rmse ?? null },
    },
    steps: summary.steps ?? [],
    metadata: summary.metadata ?? {},
  };
}

function authHeaders(): Record<string, string> {
  const { SKORE_API_KEY } = env();
  return {
    'X-API-Key': SKORE_API_KEY ?? '',
    Accept: 'application/json',
    'X-Skore-Client': 'vfm-hackathon-dashboard/2.0.0',
  };
}

export async function skoreFetch(
  urlPath: string,
  { method = 'GET', body = null }: { method?: string; body?: unknown } = {},
) {
  const { SKORE_API_KEY, SKORE_API_BASE } = env();
  if (!SKORE_API_KEY) {
    throw new Error('SKORE_API_KEY (or SKORE_HUB_API_KEY) is not configured');
  }

  const headers = authHeaders();
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${SKORE_API_BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Skore API ${res.status}: ${text || res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function slugifyProjectName(name: string) {
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

export async function createProject(displayName: string) {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) throw new Error('SKORE_WORKSPACE_ID is not configured');
  const slug = slugifyProjectName(displayName);
  if (!slug) throw new Error(`Invalid project name: ${displayName}`);

  const routing = workspaceRouting();
  const base = routing.combinedProjectPath
    ? routing.listPath
    : `/projects/${SKORE_WORKSPACE_ID}`;
  return skoreFetch(`${base}/${slug}`, { method: 'POST' });
}

export async function listWorkspaceProjects() {
  const { SKORE_WORKSPACE_ID } = env();
  if (!SKORE_WORKSPACE_ID) throw new Error('SKORE_WORKSPACE_ID is not configured');

  const routing = workspaceRouting();
  if (routing.combinedProjectPath) {
    const data = await skoreFetch(routing.combinedProjectPath);
    return normalizeProjects(data);
  }

  const data = await skoreFetch(routing.listPath);
  return normalizeProjects(data);
}

export async function listProjectReports(projectName: string): Promise<NormalizedReport[]> {
  if (!env().SKORE_WORKSPACE_ID) throw new Error('SKORE_WORKSPACE_ID is not configured');

  const reports: NormalizedReport[] = [];
  const base = projectReportsBase(projectName);

  for (const [type, endpoint] of [
    ['estimator', 'estimator-reports'],
    ['cross-validation', 'cross-validation-reports'],
  ] as const) {
    try {
      const data = await skoreFetch(`${base}/${endpoint}`);
      const list = Array.isArray(data) ? data : (data?.reports ?? []);
      reports.push(...list.map((s: RawReportSummary) => normalizeReportSummary(s, type)));
    } catch (err) {
      if (!String((err as Error).message).includes('404')) throw err;
    }
  }

  return reports.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export async function getProjectReport(projectName: string, reportId: string | number) {
  const numericId = reportIdFromUrn(String(reportId)) ?? reportId;
  const base = projectReportsBase(projectName);

  for (const endpoint of ['estimator-reports', 'cross-validation-reports'] as const) {
    try {
      const data = await skoreFetch(`${base}/${endpoint}/${numericId}`);
      const type = endpoint.startsWith('estimator') ? 'estimator' : 'cross-validation';
      return normalizeReportSummary(data, type);
    } catch (err) {
      if (!String((err as Error).message).includes('404')) throw err;
    }
  }

  throw new Error(`Report ${reportId} not found in project ${projectName}`);
}

export async function fetchAllReports() {
  const projects = await listWorkspaceProjects();
  const byProject: { project: SkoreProject; reports: NormalizedReport[] }[] = [];

  for (const project of projects) {
    const reports = await listProjectReports(project.name);
    byProject.push({ project, reports });
  }

  return { projects, byProject };
}
