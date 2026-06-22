# Virtual Flow Metering Hackathon — Live Dashboard

Full-screen (1920×1080) React dashboard for the TotalEnergies × Probabl workshop. Polls a shared Skore workspace, ranks 5 teams by MAE, and surfaces FOMO mechanics (streaks, milestone badges, sound).

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The dashboard scales to fit any viewport on a black stage.

**Simulation mode** (default): `VITE_USE_SIMULATION=true` dispatches random `PUSH_EVENT`s every 2–6s so the UI works without Skore credentials.

**Live mode**: set `VITE_USE_SIMULATION=false` and configure the proxy:

```env
SKORE_API_BASE=https://api.skore.probabl.ai
SKORE_API_KEY=sk_workspace_xxxx   # from skore.probabl.ai/account
SKORE_WORKSPACE_ID=totalenergies-workshop
```

Skore Hub auth uses the `X-API-Key` header (not Bearer). The proxy maps:

```
GET /api/projects              → GET /projects/{workspace}
GET /api/reports?project=…     → GET /projects/{workspace}/{project}/estimator-reports/
```

Test the connection:

```bash
npm run test:skore
```

## Architecture

```
team runners --put(estimator)--> Skore workspace
dashboard polls (read-only):
  GET /api/projects
  GET /api/reports?project=…
  GET /api/reports/:project/:reportId
```

The Express proxy (`server/index.js`) holds the API key. The browser never sees it.

## Teams

| Skore project   | Team          | Default LLM          |
|-----------------|---------------|----------------------|
| vfm-pression    | Team Pression | claude-opus-4.5      |
| vfm-debit       | Team Débit    | gpt-5-codex          |
| vfm-vanne       | Team Vanne    | claude-sonnet-4.5    |
| vfm-choke       | Team Choke    | qwen3-coder-480b     |
| vfm-capteur     | Team Capteur  | gemini-2.5-pro       |

Runners should attach metadata at put time:

```python
project.put(report, metadata={
    "llm": os.environ["MODEL_NAME"],
    "skill": os.environ["SKILL_NAME"],
})
```

## Config

All tunables live in `src/config.js`: poll interval, countdown, MAE thresholds, milestones, streak window, feed size, project→team map.

## Production

```bash
npm run build
npm start
```

Serves the built SPA and API from port 3001.

## Controls

- **Sound toggle** (header, off by default): Web Audio tones for push / team best / global best
- **Theme toggle** (bottom-right): light ↔ dark/midnight
- **Reset** (bottom-right): clears state, seen set, localStorage, restarts countdown
