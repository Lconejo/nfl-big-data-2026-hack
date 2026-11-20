"""API del dashboard NFL. Ejecuta: uvicorn backend.main:app --reload"""

from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from backend.analysis import build_dashboard

app = FastAPI(title="Hackathon NFL UNAM")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/dashboard")
def dashboard(
    team: Annotated[str | None, Query(min_length=2, max_length=3)] = None,
    week: Annotated[int | None, Query(ge=1, le=18)] = None,
    quarter: Annotated[int | None, Query(ge=1, le=5)] = None,
    down: Annotated[int | None, Query(ge=1, le=4)] = None,
    distance: str | None = None,
    field_zone: str | None = None,
    score_state: str | None = None,
) -> dict:
    """Devuelve métricas y jugadas del corte solicitado."""

    try:
        return build_dashboard(
            team=team,
            week=week,
            quarter=quarter,
            down=down,
            distance=distance,
            field_zone=field_zone,
            score_state=score_state,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


# StaticFiles debe montarse al final para no interceptar /health ni /api.
DASHBOARD_DIST = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if DASHBOARD_DIST.is_dir():
    app.mount("/", StaticFiles(directory=DASHBOARD_DIST, html=True), name="dashboard")
