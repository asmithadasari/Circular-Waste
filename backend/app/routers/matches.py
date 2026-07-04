"""
Explainable Recycler Matching.

GET  /api/batches/{id}/matches   -> ranked recyclers with score breakdown
POST /api/matches/{id}/select    -> lock in a recycler for this batch
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WasteBatch, Recycler, RecyclerMaterial, Match, TraceabilityEvent
from app.schemas import MatchOut, ScoreBreakdown, MatchSelect
from app.services.matching import score_recycler

router = APIRouter(tags=["matching"])


@router.get("/api/batches/{batch_id}/matches", response_model=list[MatchOut])
def get_matches(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(WasteBatch).filter(WasteBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    eligible = (
        db.query(Recycler, RecyclerMaterial)
        .join(RecyclerMaterial, RecyclerMaterial.recycler_id == Recycler.id)
        .filter(RecyclerMaterial.material_type == batch.material_type)
        .all()
    )
    if not eligible:
        return []

    results = []
    for recycler, recycler_material in eligible:
        breakdown = score_recycler(batch, recycler, recycler_material)

        existing = (
            db.query(Match)
            .filter(Match.batch_id == batch.id, Match.recycler_id == recycler.id)
            .first()
        )
        if existing:
            if existing.status == "PROPOSED":
                existing.match_score = breakdown["total"]
                existing.score_breakdown = breakdown
            match_row = existing
        else:
            match_row = Match(
                batch_id=batch.id,
                recycler_id=recycler.id,
                match_score=breakdown["total"],
                score_breakdown=breakdown,
                status="PROPOSED",
            )
            db.add(match_row)
        db.flush()

        results.append(MatchOut(
            match_id=match_row.id,
            recycler_id=recycler.id,
            recycler_name=recycler.name,
            distance_km=recycler.distance_km,
            rating=recycler.rating,
            capacity=recycler.capacity,
            score_breakdown=ScoreBreakdown(**breakdown),
            status=match_row.status,
        ))

    db.commit()
    results.sort(key=lambda m: m.score_breakdown.total, reverse=True)
    return results


@router.post("/api/matches/{match_id}/select", response_model=MatchOut)
def select_match(match_id: str, payload: MatchSelect, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    batch = db.query(WasteBatch).filter(WasteBatch.id == match.batch_id).first()
    recycler = db.query(Recycler).filter(Recycler.id == match.recycler_id).first()

    # Reject all other proposed matches for this batch, select this one
    other_matches = db.query(Match).filter(Match.batch_id == match.batch_id, Match.id != match.id).all()
    for m in other_matches:
        if m.status == "PROPOSED":
            m.status = "REJECTED"

    match.status = "SELECTED"
    batch.status = "MATCHED"

    db.add(TraceabilityEvent(
        batch_id=batch.id,
        event_type="MATCHED",
        actor=payload.actor or "demo-user",
        event_metadata={"recycler_id": recycler.id, "recycler_name": recycler.name, "match_score": match.match_score},
    ))
    db.commit()
    db.refresh(match)

    return MatchOut(
        match_id=match.id,
        recycler_id=recycler.id,
        recycler_name=recycler.name,
        distance_km=recycler.distance_km,
        rating=recycler.rating,
        capacity=recycler.capacity,
        score_breakdown=ScoreBreakdown(**match.score_breakdown),
        status=match.status,
    )
