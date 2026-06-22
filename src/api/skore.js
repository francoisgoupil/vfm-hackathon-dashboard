export async function listProjects() {
  const res = await fetch('/api/projects');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `projects ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.projects ?? [];
}

export async function listReports(projectId) {
  const res = await fetch(`/api/reports?project=${encodeURIComponent(projectId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `reports ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.reports ?? [];
}

export async function getReport(projectId, reportId) {
  const res = await fetch(
    `/api/reports/${encodeURIComponent(projectId)}/${encodeURIComponent(reportId)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `report ${res.status}`);
  }
  return res.json();
}
