"""
POST /api/classify
Accepts an uploaded waste image and returns the predicted material,
confidence, and recyclability. See app/services/classifier.py for the
actual computer-vision logic and its honest limitations.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import settings
from app.schemas import ClassifyResponse
from app.services.classifier import classify_image, recyclability_for

router = APIRouter(tags=["classification"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("/api/classify", response_model=ClassifyResponse)
async def classify(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG or WEBP image.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        material, confidence = classify_image(image_bytes)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read this image. Please try a different file.")

    return ClassifyResponse(
        material=material,
        confidence=confidence,
        recyclability=recyclability_for(material),
        needs_verification=confidence < settings.CONFIDENCE_THRESHOLD,
    )
