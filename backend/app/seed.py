"""
Seeds 9 clearly SIMULATED recyclers with accepted materials, so the
Recycler Matching screen has something meaningful to rank on day one.

Run with:
    python -m app.seed
"""
from app.database import Base, engine, SessionLocal
from app.models import Recycler, RecyclerMaterial

SIMULATED_RECYCLERS = [
    # name, distance_km, rating, capacity_kg, [(material, min_qty), ...]
    ("GreenCycle Plastics Pvt Ltd", 3.2, 4.7, 500, [("plastic", 10)]),
    ("EcoMetal Recovery", 8.5, 4.3, 1000, [("metal", 20)]),
    ("PaperLoop Recyclers", 4.8, 4.8, 300, [("paper", 5), ("cardboard", 5)]),
    ("Crystal Glass Recycling Co.", 12.0, 3.9, 400, [("glass", 15)]),
    ("Urban Organic Composting Unit", 2.1, 4.5, 200, [("organic", 5)]),
    ("Citywide Multi-Material Recyclers", 15.6, 4.1, 800, [("plastic", 10), ("metal", 10), ("glass", 10)]),
    ("Sunrise Cardboard & Paper Mills", 6.4, 4.6, 600, [("cardboard", 10), ("paper", 10)]),
    ("MetroPlast Processing", 22.0, 3.6, 350, [("plastic", 20)]),
    ("BlueEarth Organic Solutions", 9.9, 4.2, 250, [("organic", 8)]),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Recycler).count() > 0:
            print("Recyclers already seeded, skipping. Delete rows manually to reseed.")
            return

        for name, distance_km, rating, capacity, materials in SIMULATED_RECYCLERS:
            recycler = Recycler(
                name=name,
                latitude=None,
                longitude=None,
                distance_km=distance_km,
                rating=rating,
                capacity=capacity,
            )
            db.add(recycler)
            db.flush()
            for material_type, min_qty in materials:
                db.add(RecyclerMaterial(
                    recycler_id=recycler.id,
                    material_type=material_type,
                    minimum_quantity=min_qty,
                ))
        db.commit()
        print(f"Seeded {len(SIMULATED_RECYCLERS)} simulated recyclers.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
