"""
Waste batch creation, retrieval, and Material Passport timeline.
"""
import random
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WasteBatch, TraceabilityEvent
from app.schemas import BatchCreate, BatchOut, TimelineEvent, StatusUpdate, ALLOWED_STATUS_EVENTS
from app.services.classifier import WASTE_CLASSES
from app.models import now_utc

router = APIRouter(tags=["batches"])

# Order defines what a valid "next" lifecycle event is from the current status.
LIFECYCLE_ORDER = [
    "COLLECTED", "CLASSIFIED", "BATCH_CREATED", "MATCHED",
    "PICKUP_SCHEDULED", "RECEIVED", "RECYCLED",
]


def generate_batch_code(db: Session) -> str:
    for _ in range(20):
        code = f"WST-{random.randint(1000, 9999)}"
        exists = db.query(WasteBatch).filter(WasteBatch.batch_code == code).first()
        if not exists:
            return code
    raise HTTPException(status_code=500, detail="Could not generate a unique batch code, please retry.")


@router.post("/api/batches", response_model=BatchOut)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db)):
    if payload.material_type not in WASTE_CLASSES:
        raise HTTPException(status_code=400, detail=f"material_type must be one of {WASTE_CLASSES}")

    batch = WasteBatch(
        batch_code=generate_batch_code(db),
        organisation_id=payload.organisation_id,
        material_type=payload.material_type,
        quantity=payload.quantity,
        source_location=payload.source_location,
        condition=payload.condition,
        image_url=payload.image_url,
        confidence=payload.confidence,
        status="BATCH_CREATED",
    )
    db.add(batch)
    db.flush()  # get batch.id before commit

    # A batch always carries its full history from the moment it was scanned.
    base_time = now_utc()
    events = [
        ("COLLECTED", "collector", {"source_location": payload.source_location}),
        ("CLASSIFIED", "ai-scanner", {"material_type": payload.material_type, "confidence": payload.confidence}),
        ("BATCH_CREATED", "system", {"quantity": payload.quantity, "condition": payload.condition}),
    ]
    for i, (event_type, actor, metadata) in enumerate(events):
        db.add(TraceabilityEvent(
            batch_id=batch.id,
            event_type=event_type,
            actor=actor,
            event_metadata=metadata,
            # Small millisecond offsets only preserve COLLECTED -> CLASSIFIED -> BATCH_CREATED
            # ordering without risking overlap with a MATCHED/status event a real user
            # triggers moments later in the demo.
            timestamp=base_time + timedelta(milliseconds=i),
        ))

    db.commit()
    db.refresh(batch)
    return batch


@router.get("/api/batches/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(WasteBatch).filter(WasteBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return batch


@router.get("/api/batches/{batch_id}/timeline", response_model=list[TimelineEvent])
def get_timeline(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(WasteBatch).filter(WasteBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    events = (
        db.query(TraceabilityEvent)
        .filter(TraceabilityEvent.batch_id == batch_id)
        .order_by(TraceabilityEvent.timestamp.asc())
        .all()
    )
    return [
        TimelineEvent(
            event_type=e.event_type,
            actor=e.actor,
            metadata=e.event_metadata,
            timestamp=e.timestamp,
        )
        for e in events
    ]


@router.post("/api/batches/{batch_id}/status", response_model=list[TimelineEvent])
def update_status(batch_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    batch = db.query(WasteBatch).filter(WasteBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    if payload.event_type not in ALLOWED_STATUS_EVENTS:
        raise HTTPException(
            status_code=400,
            detail=f"event_type must be one of {ALLOWED_STATUS_EVENTS} (COLLECTED/CLASSIFIED/BATCH_CREATED/MATCHED "
                   f"happen automatically earlier in the lifecycle).",
        )

    current_index = LIFECYCLE_ORDER.index(batch.status) if batch.status in LIFECYCLE_ORDER else 0
    new_index = LIFECYCLE_ORDER.index(payload.event_type)
    if new_index <= current_index:
        raise HTTPException(
            status_code=400,
            detail=f"Batch is already at '{batch.status}'. Cannot move backward or repeat to '{payload.event_type}'.",
        )

    db.add(TraceabilityEvent(
        batch_id=batch.id,
        event_type=payload.event_type,
        actor=payload.actor or "demo-user",
        event_metadata=payload.metadata,
    ))
    batch.status = payload.event_type
    db.commit()

    events = (
        db.query(TraceabilityEvent)
        .filter(TraceabilityEvent.batch_id == batch_id)
        .order_by(TraceabilityEvent.timestamp.asc())
        .all()
    )
    return [
        TimelineEvent(event_type=e.event_type, actor=e.actor, metadata=e.event_metadata, timestamp=e.timestamp)
        for e in events
    ]
