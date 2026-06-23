# IBM Breast Cancer Workshop — Live Dashboard

Full-screen Next.js dashboard for the IBM × Probabl Skore skills workshop. Server-renders the leaderboard from the shared Skore Hub project, then polls for new CV and private submissions.

Workshop repo: [ibm-workshop](https://github.com/probabl-ai/ibm-workshop)

## Quick start

```bash
pnpm install
cp .env.example .env   # add your SKORE_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```env
SKORE_API_BASE=https://api.skore.probabl.ai
SKORE_API_KEY=sk_workspace_xxxx
SKORE_WORKSPACE_ID=ibm-workshop/dev
```

The workshop uses `SKORE_HUB_WORKSPACE=ibm-workshop/dev` — the dashboard accepts the same value as `SKORE_WORKSPACE_ID`.

```bash
pnpm test:skore
```

## What shows on the leaderboard

Participants push reports to the shared **`dev`** project. Ranking uses **ROC-AUC** on the test fold (`roc_auc_mean`, `data_source=test`) — higher is better.

| Report type | Skore endpoint | Typical key |
|-------------|----------------|-------------|
| Public CV | `cross-validation-reports` | `01_baseline` |
| Private holdout | `estimator-reports` | `{SKORE_USERNAME}/01_baseline_private` |

Hub keys with a `/` prefix the participant name on the leaderboard (from `SKORE_USERNAME` in the workshop `.env`).

## Skore API notes

- `SKORE_WORKSPACE_ID=ibm-workshop/dev` is a combined workspace/project path — report URLs are `/projects/ibm-workshop/dev/cross-validation-reports`, not `…/dev/dev/…`.
- List endpoints return a single project object for that path, not an array of team projects.
- Report summaries include `estimator_class_name`, `key`, `metrics[]`, `ml_task` — not pipeline steps or agent skill metadata.

## Architecture

```
ibm-workshop participants
  → skore.evaluate + project.put on ibm-workshop/dev
Next.js SSR: fetch all reports → initial leaderboard
Client poll (3s): GET /api/projects + /api/reports
```

## Production

```bash
pnpm build
pnpm start
```
