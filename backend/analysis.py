"""Carga, limpieza y agregaciones para el dashboard de pases NFL."""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

DISTANCE_BUCKETS = (
    ("short", "Corta (1-3)"),
    ("medium", "Media (4-6)"),
    ("long", "Larga (7-10)"),
    ("very_long", "Muy larga (11+)"),
)
FIELD_ZONES = (
    "own_red_zone",
    "own_territory",
    "midfield",
    "opponent_territory",
    "opponent_red_zone",
)
SCORE_STATES = ("trailing", "tied", "leading")
LOSS_REASONS = (
    ("interception", "Intercepción"),
    ("fumble_lost", "Fumble perdido"),
    ("turnover_on_downs", "Pérdida por downs"),
)
MIN_VISUAL_SAMPLE = 10

PLAYS_COLUMNS = [
    "gameId",
    "playId",
    "playDescription",
    "quarter",
    "down",
    "yardsToGo",
    "possessionTeam",
    "defensiveTeam",
    "yardlineSide",
    "yardlineNumber",
    "gameClock",
    "preSnapHomeScore",
    "preSnapVisitorScore",
    "passResult",
    "playResult",
    "offenseFormation",
    "pff_playAction",
    "pff_passCoverage",
]
GAMES_COLUMNS = [
    "gameId",
    "season",
    "week",
    "gameDate",
    "homeTeamAbbr",
    "visitorTeamAbbr",
]
PFF_COLUMNS = [
    "gameId",
    "playId",
    "pff_role",
    "pff_hit",
    "pff_hurry",
    "pff_sack",
]


@dataclass(frozen=True)
class AnalysisData:
    """Datos preparados y cifras del universo sin filtros."""

    plays: pd.DataFrame
    total_games: int
    total_pass_plays: int
    valid_pass_plays: int
    season: int


def _final_description(value: Any) -> str:
    """Conserva solo el fallo final después de la última reversión."""

    description = "" if pd.isna(value) else str(value).strip()
    reversals = list(re.finditer(r"\bREVERSED\b[.:]?", description, re.IGNORECASE))
    if not reversals:
        return description
    final_text = description[reversals[-1].end() :].strip()
    return final_text or description


def _last_recovery_team(description: str) -> str | None:
    recoveries = re.findall(
        r"\bRECOVERED\s+BY\s+([A-Z]{2,3})-",
        description.upper(),
    )
    return recoveries[-1] if recoveries else None


def _accepted_defensive_penalty(description: str, defensive_team: Any) -> bool:
    """Detecta una penalización aceptada acreditada al equipo defensor."""

    if pd.isna(defensive_team):
        return False
    team = str(defensive_team).upper()
    upper = description.upper()
    penalties = list(
        re.finditer(r"PENALTY\s+ON\s+([A-Z]{2,3})(?:-|,)", upper)
    )
    for index, match in enumerate(penalties):
        end = penalties[index + 1].start() if index + 1 < len(penalties) else len(upper)
        clause = upper[match.start() : end]
        if match.group(1) == team and "DECLINED" not in clause and "OFFSETTING" not in clause:
            return True
    return False


def _field_position(row: pd.Series) -> float:
    side = row["yardlineSide"]
    number = row["yardlineNumber"]
    if pd.isna(number):
        return np.nan
    number = float(number)
    if pd.isna(side):
        return 50.0 if number == 50 else np.nan
    if side == row["possessionTeam"]:
        return number
    if side == row["defensiveTeam"]:
        return 100.0 - number
    return 50.0 if number == 50 else np.nan


def _field_zone(position: Any) -> str | None:
    if pd.isna(position):
        return None
    position = float(position)
    if position <= 19:
        return "own_red_zone"
    if position <= 39:
        return "own_territory"
    if position <= 60:
        return "midfield"
    if position <= 79:
        return "opponent_territory"
    return "opponent_red_zone"


def _distance_bucket(value: Any) -> str | None:
    if pd.isna(value) or float(value) < 1:
        return None
    distance = float(value)
    if distance <= 3:
        return "short"
    if distance <= 6:
        return "medium"
    if distance <= 10:
        return "long"
    return "very_long"


def _score_state(row: pd.Series) -> str | None:
    offense = row["possessionTeam"]
    if offense == row["homeTeamAbbr"]:
        margin = row["preSnapHomeScore"] - row["preSnapVisitorScore"]
    elif offense == row["visitorTeamAbbr"]:
        margin = row["preSnapVisitorScore"] - row["preSnapHomeScore"]
    else:
        return None
    if pd.isna(margin):
        return None
    if margin < 0:
        return "trailing"
    if margin > 0:
        return "leading"
    return "tied"


def _pressure_by_play() -> pd.DataFrame:
    pff = pd.read_csv(DATA_DIR / "pffScoutingData.csv", usecols=PFF_COLUMNS)
    rush = pff.loc[pff["pff_role"].eq("Pass Rush")].copy()
    indicators = ["pff_hit", "pff_hurry", "pff_sack"]
    rush[indicators] = rush[indicators].apply(pd.to_numeric, errors="coerce").fillna(0)
    rush["pressured"] = rush[indicators].eq(1).any(axis=1)
    return (
        rush.groupby(["gameId", "playId"], as_index=False, sort=False)["pressured"]
        .any()
    )


@lru_cache(maxsize=1)
def load_data() -> AnalysisData:
    """Lee los tres CSV una sola vez y deriva las variables del dashboard."""

    plays = pd.read_csv(DATA_DIR / "plays.csv", usecols=PLAYS_COLUMNS)
    games = pd.read_csv(DATA_DIR / "games.csv", usecols=GAMES_COLUMNS)
    total_pass_plays = int(len(plays))

    plays["description"] = plays["playDescription"].map(_final_description)
    # Una reversión puede cambiar una jugada a NO PLAY; solo importa el texto final.
    valid = ~plays["description"].str.contains(r"\bNO PLAY\b", case=False, na=False)
    plays = plays.loc[valid].copy()

    numeric_columns = [
        "quarter",
        "down",
        "yardsToGo",
        "yardlineNumber",
        "preSnapHomeScore",
        "preSnapVisitorScore",
        "playResult",
        "pff_playAction",
    ]
    plays[numeric_columns] = plays[numeric_columns].apply(pd.to_numeric, errors="coerce")

    plays = plays.merge(games, on="gameId", how="left", validate="many_to_one")
    plays = plays.merge(
        _pressure_by_play(),
        on=["gameId", "playId"],
        how="left",
        validate="one_to_one",
    )
    plays["pressured"] = plays["pressured"].fillna(False).astype(bool)

    plays["distance_bucket"] = plays["yardsToGo"].map(_distance_bucket)
    plays["field_position"] = plays.apply(_field_position, axis=1)
    plays["field_zone"] = plays["field_position"].map(_field_zone)
    plays["score_state"] = plays.apply(_score_state, axis=1)
    plays["last_recovery_team"] = plays["description"].map(_last_recovery_team)
    plays["accepted_defensive_penalty"] = plays.apply(
        lambda row: _accepted_defensive_penalty(row["description"], row["defensiveTeam"]),
        axis=1,
    )

    returned_to_offense = (
        plays["passResult"].eq("IN")
        & plays["description"].str.contains("FUMBL", case=False, na=False)
        & plays["last_recovery_team"].eq(plays["possessionTeam"])
    )
    interception_loss = plays["passResult"].eq("IN") & ~returned_to_offense
    offensive_fumble_lost = (
        ~plays["passResult"].eq("IN")
        & plays["description"].str.contains("FUMBL", case=False, na=False)
        & plays["last_recovery_team"].eq(plays["defensiveTeam"])
    )
    turnover_on_downs = (
        plays["down"].eq(4)
        & ~plays["accepted_defensive_penalty"]
        & plays["playResult"].lt(plays["yardsToGo"])
        & ~returned_to_offense
        & ~interception_loss
        & ~offensive_fumble_lost
    )

    plays["loss_reason"] = np.select(
        [interception_loss, offensive_fumble_lost, turnover_on_downs],
        ["interception", "fumble_lost", "turnover_on_downs"],
        default=None,
    )
    plays["is_loss"] = plays["loss_reason"].notna()
    plays["conversion_opportunity"] = plays["down"].isin([3, 4])
    plays["converted"] = (
        plays["conversion_opportunity"]
        & (
            plays["playResult"].ge(plays["yardsToGo"])
            | plays["accepted_defensive_penalty"]
        )
        & ~plays["is_loss"]
    )
    plays["play_action"] = np.select(
        [plays["pff_playAction"].eq(1), plays["pff_playAction"].eq(0)],
        ["Sí", "No"],
        default=None,
    )

    seasons = games["season"].dropna().astype(int).unique().tolist()
    season = int(seasons[0]) if seasons else 0
    return AnalysisData(
        plays=plays,
        total_games=int(games["gameId"].nunique()),
        total_pass_plays=total_pass_plays,
        valid_pass_plays=int(len(plays)),
        season=season,
    )


def _rate(numerator: int, denominator: int) -> float:
    return round(100.0 * numerator / denominator, 1) if denominator else 0.0


def _performance_point(
    frame: pd.DataFrame,
    key: str,
    label: str,
) -> dict[str, Any]:
    attempts = int(len(frame))
    conversions = int(frame["converted"].sum())
    losses = int(frame["is_loss"].sum())
    return {
        "key": key,
        "label": label,
        "attempts": attempts,
        "conversions": conversions,
        "conversionRate": _rate(conversions, attempts),
        "losses": losses,
        "lossRate": _rate(losses, attempts),
    }


def _filter_options(plays: pd.DataFrame) -> dict[str, Any]:
    return {
        "teams": sorted(plays["possessionTeam"].dropna().astype(str).unique().tolist()),
        "weeks": sorted(plays["week"].dropna().astype(int).unique().tolist()),
        "quarters": sorted(
            int(value)
            for value in plays["quarter"].dropna().unique()
            if 1 <= int(value) <= 5
        ),
        "downs": [1, 2, 3, 4],
        "distanceBuckets": [
            {"key": key, "label": label} for key, label in DISTANCE_BUCKETS
        ],
        "fieldZones": list(FIELD_ZONES),
        "scoreStates": list(SCORE_STATES),
    }


def _validate_filters(filters: dict[str, Any], options: dict[str, Any]) -> None:
    allowed = {
        "team": options["teams"],
        "week": options["weeks"],
        "quarter": options["quarters"],
        "down": options["downs"],
        "distance": [key for key, _ in DISTANCE_BUCKETS],
        "field_zone": list(FIELD_ZONES),
        "score_state": list(SCORE_STATES),
    }
    for name, value in filters.items():
        if value is not None and value not in allowed[name]:
            raise ValueError(f"Filtro {name!r} no válido: {value!r}")


def _apply_filters(plays: pd.DataFrame, filters: dict[str, Any]) -> pd.DataFrame:
    result = plays
    columns = {
        "team": "possessionTeam",
        "week": "week",
        "quarter": "quarter",
        "down": "down",
        "distance": "distance_bucket",
        "field_zone": "field_zone",
        "score_state": "score_state",
    }
    for name, value in filters.items():
        if value is not None:
            result = result.loc[result[columns[name]].eq(value)]
    return result.copy()


def _summary(plays: pd.DataFrame) -> dict[str, Any]:
    attempts = int(len(plays))
    losses = int(plays["is_loss"].sum())
    third = plays.loc[plays["down"].eq(3)]
    fourth = plays.loc[plays["down"].eq(4)]
    third_conversions = int(third["converted"].sum())
    fourth_conversions = int(fourth["converted"].sum())
    return {
        "attempts": attempts,
        "losses": losses,
        "lossRate": _rate(losses, attempts),
        "interceptions": int(plays["loss_reason"].eq("interception").sum()),
        "fumblesLost": int(plays["loss_reason"].eq("fumble_lost").sum()),
        "turnoverOnDowns": int(plays["loss_reason"].eq("turnover_on_downs").sum()),
        "thirdAttempts": int(len(third)),
        "thirdConversions": third_conversions,
        "thirdConversionRate": _rate(third_conversions, len(third)),
        "fourthAttempts": int(len(fourth)),
        "fourthConversions": fourth_conversions,
        "fourthConversionRate": _rate(fourth_conversions, len(fourth)),
        "pressuredAttempts": int(plays["pressured"].sum()),
    }


def _headline(
    summary: dict[str, Any], scope: str, plays: pd.DataFrame
) -> dict[str, str]:
    """Prioriza el hallazgo que ayuda a decidir en tercera o cuarta oportunidad."""

    if summary["attempts"] == 0:
        return {
            "title": "No hay jugadas válidas para este corte",
            "detail": "Amplía o cambia los filtros para recuperar observaciones.",
        }

    fourth = plays.loc[plays["down"].eq(4)]
    if not fourth.empty:
        candidates: list[tuple[float, int, int, str]] = []
        for key, label in DISTANCE_BUCKETS:
            segment = fourth.loc[fourth["distance_bucket"].eq(key)]
            attempts = int(len(segment))
            if attempts:
                losses = int(segment["is_loss"].sum())
                candidates.append((_rate(losses, attempts), attempts, losses, label))
        supported = [item for item in candidates if item[1] >= MIN_VISUAL_SAMPLE]
        loss_rate, attempts, losses, label = max(supported or candidates)

        pressured = fourth.loc[fourth["pressured"]]
        unpressured = fourth.loc[~fourth["pressured"]]
        pressure_detail = ""
        if not pressured.empty and not unpressured.empty:
            pressured_rate = _rate(int(pressured["is_loss"].sum()), len(pressured))
            unpressured_rate = _rate(
                int(unpressured["is_loss"].sum()), len(unpressured)
            )
            pressure_detail = (
                f" Con presión, la pérdida fue {pressured_rate:.1f}%, frente a "
                f"{unpressured_rate:.1f}% sin presión."
            )
        return {
            "title": (
                f"En cuarta y {label.lower()}, {loss_rate:.1f}% de los pases "
                "pierde la posesión"
            ),
            "detail": (
                f"El corte registra {losses} pérdidas en {attempts} intentos de ese "
                f"segmento. La conversión total en cuarta fue "
                f"{summary['fourthConversionRate']:.1f}%.{pressure_detail}"
            ),
        }

    if summary["thirdAttempts"]:
        return {
            "title": (
                f"La conversión observada en tercera es "
                f"{summary['thirdConversionRate']:.1f}%"
            ),
            "detail": (
                f"{scope} convirtió {summary['thirdConversions']} de "
                f"{summary['thirdAttempts']} intentos de pase en tercera oportunidad."
            ),
        }

    return {
        "title": f"{summary['lossRate']:.1f}% de los pases pierde la posesión",
        "detail": (
            f"En {scope}, el corte reúne {summary['losses']} pérdidas entre "
            f"{summary['attempts']} jugadas válidas."
        ),
    }


def _breakdowns(plays: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    loss_by_down = [
        _performance_point(
            plays.loc[plays["down"].eq(down)],
            str(down),
            f"{down}.ª",
        )
        for down in (1, 2, 3, 4)
    ]

    def by_distance(down: int) -> list[dict[str, Any]]:
        down_plays = plays.loc[plays["down"].eq(down)]
        return [
            _performance_point(
                down_plays.loc[down_plays["distance_bucket"].eq(key)],
                key,
                label,
            )
            for key, label in DISTANCE_BUCKETS
        ]

    conversion_plays = plays.loc[plays["conversion_opportunity"]]
    pressure = [
        _performance_point(
            conversion_plays.loc[conversion_plays["pressured"].eq(value)],
            key,
            label,
        )
        for value, key, label in (
            (False, "unpressured", "Sin presión"),
            (True, "pressured", "Con presión"),
        )
    ]
    return {
        "lossByDown": loss_by_down,
        "fourthByDistance": by_distance(4),
        "thirdByDistance": by_distance(3),
        "pressureComparison": pressure,
    }


def _loss_reasons(plays: pd.DataFrame) -> list[dict[str, Any]]:
    total_losses = int(plays["is_loss"].sum())
    if total_losses == 0:
        return []
    result = []
    for key, label in LOSS_REASONS:
        count = int(plays["loss_reason"].eq(key).sum())
        result.append(
            {
                "key": key,
                "label": label,
                "count": count,
                "percentage": _rate(count, total_losses),
                "attempts": int(len(plays)),
                "conversions": None,
                "conversionRate": None,
                "losses": count,
                "lossRate": _rate(count, len(plays)),
            }
        )
    return result


def _decision_row(category: str, option: str, frame: pd.DataFrame) -> dict[str, Any]:
    attempts = int(len(frame))
    conversions = int(frame["converted"].sum())
    losses = int(frame["is_loss"].sum())
    warning = None
    if attempts < MIN_VISUAL_SAMPLE:
        warning = f"muestra menor a {MIN_VISUAL_SAMPLE} intentos"
    return {
        "category": category,
        "option": option,
        "attempts": attempts,
        "conversionRate": _rate(conversions, attempts),
        "lossRate": _rate(losses, attempts),
        "sampleWarning": warning,
    }


def _decisions(plays: pd.DataFrame) -> list[dict[str, Any]]:
    opportunities = plays.loc[plays["conversion_opportunity"]]
    result = [
        _decision_row(
            "Play action",
            option,
            opportunities.loc[opportunities["play_action"].eq(option)],
        )
        for option in ("Sí", "No")
    ]

    formations = (
        opportunities["offenseFormation"]
        .dropna()
        .astype(str)
        .value_counts()
        .rename_axis("formation")
        .reset_index(name="attempts")
        .sort_values(["attempts", "formation"], ascending=[False, True])
    )
    for formation in formations["formation"]:
        frame = opportunities.loc[opportunities["offenseFormation"].eq(formation)]
        result.append(_decision_row("Formación", formation, frame))
    return result


def _recent_loss_plays(plays: pd.DataFrame) -> list[dict[str, Any]]:
    labels = dict(LOSS_REASONS)
    recent = (
        plays.loc[plays["is_loss"]]
        .sort_values(["gameId", "playId"], ascending=[False, False])
        .head(12)
    )
    result = []
    for row in recent.itertuples(index=False):
        result.append(
            {
                "gameId": int(row.gameId),
                "playId": int(row.playId),
                "week": int(row.week),
                "offense": row.possessionTeam,
                "defense": row.defensiveTeam,
                "quarter": int(row.quarter),
                "clock": row.gameClock,
                "down": int(row.down),
                "yardsToGo": int(row.yardsToGo),
                "fieldZone": row.field_zone,
                "formation": row.offenseFormation,
                "coverage": row.pff_passCoverage,
                "pressured": bool(row.pressured),
                "lossReason": labels.get(row.loss_reason),
                "description": row.description,
            }
        )
    return result


def _json_safe(value: Any) -> Any:
    """Convierte escalares de pandas/numpy y valores faltantes a JSON estricto."""

    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if value is None or value is pd.NA:
        return None
    if isinstance(value, (float, np.floating)) and np.isnan(value):
        return None
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    return value


def build_dashboard(
    *,
    team: str | None = None,
    week: int | None = None,
    quarter: int | None = None,
    down: int | None = None,
    distance: str | None = None,
    field_zone: str | None = None,
    score_state: str | None = None,
) -> dict[str, Any]:
    """Construye la respuesta completa del endpoint con filtros opcionales."""

    data = load_data()
    options = _filter_options(data.plays)
    normalized_team = team.strip().upper() if team else None
    filters = {
        "team": normalized_team,
        "week": week,
        "quarter": quarter,
        "down": down,
        "distance": distance,
        "field_zone": field_zone,
        "score_state": score_state,
    }
    _validate_filters(filters, options)
    filtered = _apply_filters(data.plays, filters)
    summary = _summary(filtered)
    scope = normalized_team or "Toda la NFL"
    response: dict[str, Any] = {
        "meta": {
            "scope": scope,
            "season": data.season,
            "totalGames": int(filtered["gameId"].nunique()),
            "totalPassPlays": data.total_pass_plays,
            "validPassPlays": data.valid_pass_plays,
            "filteredPlays": int(len(filtered)),
        },
        "filters": options,
        "summary": summary,
        "headline": _headline(summary, scope, filtered),
        **_breakdowns(filtered),
        "lossReasons": _loss_reasons(filtered),
        "decisions": _decisions(filtered),
        "plays": _recent_loss_plays(filtered),
    }
    return _json_safe(response)
