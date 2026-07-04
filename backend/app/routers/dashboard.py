"""
ESG Dashboard aggregates.

Every number here comes from real waste_batches / traceability_events
rows created during this session's demo flow - nothing is invented.
No carbon-equivalent figures are calculated in this MVP; if that is
added later, it must be clearly labelled "estimate" with documented
conversion factors, per the problem statement's guardrails.
"""
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WasteBatch
from app.schemas import DashboardResponse
from app.services.insights import generate_insight

router = APIRouter(tags=["dashboard"])

# A batch counts as "diverted from landfill" once it has actually reached
# a recycler, i.e. RECEIVED or fully RECYCLED.
DIVERTED_STATUSES = {"RECEIVED", "RECYCLED"}
ACTIVE_STATUSES_EXCLUDE = {"RECYCLED"}


@router.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    batches = db.query(WasteBatch).all()

    total_kg = sum(b.quantity for b in batches)
    diverted_kg = sum(b.quantity for b in batches if b.status in DIVERTED_STATUSES)
    diversion_rate = (diverted_kg / total_kg * 100) if total_kg else 0.0
    active_batches = sum(1 for b in batches if b.status not in ACTIVE_STATUSES_EXCLUDE)

    waste_by_material: dict[str, float] = defaultdict(float)
    source_totals: dict[str, float] = defaultdict(float)
    status_counts: dict[str, int] = defaultdict(int)
    trend_by_day: dict[str, dict[str, float]] = defaultdict(lambda: {"processed": 0.0, "diverted": 0.0})

    for b in batches:
        waste_by_material[b.material_type] += b.quantity
        source_totals[b.source_location] += b.quantity
        status_counts[b.status] += 1

        day = b.created_at.date().isoformat() if b.created_at else "unknown"
        trend_by_day[day]["processed"] += b.quantity
        if b.status in DIVERTED_STATUSES:
            trend_by_day[day]["diverted"] += b.quantity

    diversion_trend = [
        {"date": day, "processed": round(v["processed"], 2), "diverted": round(v["diverted"], 2)}
        for day, v in sorted(trend_by_day.items())
    ]

    insight = generate_insight(dict(waste_by_material), dict(source_totals))

    return DashboardResponse(
        total_waste_processed_kg=round(total_kg, 2),
        waste_diverted_kg=round(diverted_kg, 2),
        diversion_rate_percent=round(diversion_rate, 1),
        active_batches=active_batches,
        waste_by_material={k: round(v, 2) for k, v in waste_by_material.items()},
        diversion_trend=diversion_trend,
        lifecycle_status_counts=dict(status_counts),
        insight=insight,
    )
