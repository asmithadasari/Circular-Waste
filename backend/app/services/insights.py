"""
ESG Intelligence - deterministic insight generation.

Per the roadmap, an LLM call is OPTIONAL and only used if genuinely
available; the application must keep working without it. This function
produces a rule-based insight directly from real dashboard aggregates,
so the demo never depends on an external API being reachable.
"""


def generate_insight(waste_by_material: dict[str, float], source_counts: dict[str, float] | None = None) -> str:
    if not waste_by_material or sum(waste_by_material.values()) == 0:
        return "Not enough batch data yet to generate an ESG insight. Create a few waste batches to unlock this."

    top_material = max(waste_by_material, key=waste_by_material.get)
    top_qty = waste_by_material[top_material]
    total = sum(waste_by_material.values())
    share = (top_qty / total) * 100 if total else 0

    source_clause = ""
    if source_counts:
        top_source = max(source_counts, key=source_counts.get)
        source_clause = f" {top_source} is the largest contributing source location."

    return (
        f"{top_material.capitalize()} represents the largest waste stream at "
        f"{share:.0f}% of total processed volume ({top_qty:.1f} kg)."
        f"{source_clause} Increasing dedicated collection capacity for "
        f"{top_material} is the highest-impact intervention available right now."
    )
