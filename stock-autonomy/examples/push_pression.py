"""
Team Pression — push an estimator report to Skore Hub.

Skore slugifies "Pression" → project name `pression` in workspace
`totalenergies-workshop`. The dashboard maps that to "Team Pression".

Usage (from repo root):
  python examples/push_pression.py

Reads SKORE_API_KEY from ../.env and sets SKORE_HUB_API_KEY for skore.login().
"""

from __future__ import annotations

import os
from pathlib import Path

# Load dashboard .env before skore imports (skore-hub uses SKORE_HUB_API_KEY)
_env = Path(__file__).resolve().parent.parent / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val

if os.environ.get("SKORE_API_KEY") and not os.environ.get("SKORE_HUB_API_KEY"):
    os.environ["SKORE_HUB_API_KEY"] = os.environ["SKORE_API_KEY"]

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from skore import Project, evaluate, login

WORKSPACE = os.environ.get("SKORE_WORKSPACE", "totalenergies-workshop")
PROJECT = os.environ.get("SKORE_PROJECT", "Pression")  # stored as `pression`
KEY = os.environ.get("SKORE_RUN_KEY", "rf-v1")


def make_synthetic_vfm_data(n: int = 500) -> tuple[pd.DataFrame, pd.Series]:
    """Minimal VFM-like regression set: predict flow rate from sensor readings."""
    rng = np.random.default_rng(42)
    upstream_p = rng.uniform(20, 80, n)
    downstream_p = upstream_p - rng.uniform(1, 8, n)
    temperature = rng.uniform(40, 120, n)
    valve_position = rng.uniform(0, 1, n)
    choke_size = rng.uniform(10, 50, n)

    X = pd.DataFrame(
        {
            "upstream_pressure": upstream_p,
            "downstream_pressure": downstream_p,
            "temperature": temperature,
            "valve_position": valve_position,
            "choke_size": choke_size,
        }
    )
    y = (
        0.4 * upstream_p
        + 12 * valve_position
        + 0.2 * choke_size
        + rng.normal(0, 2.5, n)
    )
    return X, pd.Series(y, name="flow_rate_kg_s")


def check_skore_versions() -> None:
    from importlib.metadata import version, PackageNotFoundError

    try:
        skore_v = version("skore")
        hub_v = version("skore-hub-project")
    except PackageNotFoundError:
        raise SystemExit('Install hub support: pip install -U "skore[hub]>=0.19.0"') from None

    skore_major_minor = tuple(int(x) for x in skore_v.split(".")[:2])
    if skore_major_minor < (0, 19):
        raise SystemExit(
            f"Incompatible versions: skore {skore_v} + skore-hub-project {hub_v}.\n"
            'Upgrade together:\n  pip install -U "skore[hub]>=0.19.0"\n'
            "Then re-run: python examples/push_pression.py"
        )


def main() -> None:
    if not os.environ.get("SKORE_HUB_API_KEY"):
        raise SystemExit(
            "Missing API key. Set SKORE_API_KEY in .env (quoted if it contains : / + =)."
        )

    check_skore_versions()
    login(mode="hub")

    X, y = make_synthetic_vfm_data()

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", RandomForestRegressor(n_estimators=100, random_state=0)),
        ]
    )

    report = evaluate(pipeline, X, y, splitter=5)

    # Hub only exposes built-in metrics (R², RMSE). MAE / custom metrics must be
    # computed locally and encoded in the put key for the dashboard.
    mae_mean = float(report.metrics.mae().loc["MAE", ("mean", "")])
    print(f"MAE (cross-val mean): {mae_mean:.4f} kg/s")

    run_key = f"{KEY}@mae={mae_mean:.4f}"
    project = Project(f"{WORKSPACE}/{PROJECT}", mode="hub")
    project.put(run_key, report)

    print(f"Pushed to {WORKSPACE}/pression — key={run_key}")
    print("Dashboard will pick this up on the next poll (≤3s).")


if __name__ == "__main__":
    main()
