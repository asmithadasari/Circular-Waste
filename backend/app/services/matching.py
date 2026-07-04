"""
Explainable Recycler Matching engine.

Deterministic and auditable ON PURPOSE - no LLM is involved in scoring,
so every number a recycler receives can be explained to a judge or an
operator. Total score is always out of 100:

    Material compatibility  -> 40 points
    Capacity / quantity fit -> 25 points
    Distance                -> 20 points
    Recycler reliability    -> 15 points
"""
from app.models import WasteBatch, Recycler, RecyclerMaterial


def score_recycler(batch: WasteBatch, recycler: Recycler, recycler_material: RecyclerMaterial) -> dict:
    # 1) Material compatibility (40) - binary: recycler already filtered to accept this material
    material_score = 40.0

    # 2) Capacity / quantity fit (25)
    #    Full points if recycler capacity comfortably covers the batch AND
    #    the batch meets the recycler's minimum quantity requirement.
    if batch.quantity < recycler_material.minimum_quantity:
        capacity_score = 5.0  # below minimum accepted quantity
    elif recycler.capacity <= 0:
        capacity_score = 0.0
    else:
        utilisation = batch.quantity / recycler.capacity
        if utilisation <= 1.0:
            capacity_score = 25.0 * min(1.0, 0.6 + 0.4 * utilisation)  # well within capacity
        elif utilisation <= 1.3:
            capacity_score = 15.0  # slightly over ideal load, still workable
        else:
            capacity_score = 5.0  # far exceeds a single pickup's capacity

    # 3) Distance (20) - simulated distance_km on the recycler record
    distance = recycler.distance_km or 999
    if distance <= 5:
        distance_score = 20.0
    elif distance <= 10:
        distance_score = 15.0
    elif distance <= 20:
        distance_score = 10.0
    else:
        distance_score = 5.0

    # 4) Recycler reliability (15) - from simulated rating out of 5
    rating = recycler.rating or 0
    if rating >= 4.5:
        reliability_score = 15.0
    elif rating >= 4.0:
        reliability_score = 10.0
    elif rating >= 3.0:
        reliability_score = 6.0
    else:
        reliability_score = 3.0

    total = round(material_score + capacity_score + distance_score + reliability_score, 1)

    return {
        "material_match": material_score,
        "capacity_fit": round(capacity_score, 1),
        "distance": distance_score,
        "reliability": reliability_score,
        "total": total,
    }
