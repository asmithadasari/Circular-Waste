"""
ESG Intelligence - OpenAI LLM insight generation.
"""
import logging
import time
from openai import OpenAI, APIError, APITimeoutError, APIConnectionError
from app.config import settings

logger = logging.getLogger(__name__)


def generate_llm_insight(
    waste_by_material: dict[str, float],
    source_totals: dict[str, float]
) -> str | None:
    """
    Generates an ESG insight using OpenAI GPT-4o-mini from waste aggregate metrics.
    If the API key is not configured, or if any error occurs (network timeout, rate limit,
    authentication issues, etc.), it returns None to allow clean fallback to deterministic insights.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        logger.warning("OpenAI API Key is missing or empty. Skipping LLM insight generation.")
        return None

    if not waste_by_material or sum(waste_by_material.values()) == 0:
        logger.info("Not enough data to run LLM insight generation.")
        return None

    # Construct the data summaries
    material_summary = ", ".join([f"{k}: {v:.2f} kg" for k, v in waste_by_material.items()])
    source_summary = ", ".join([f"{k}: {v:.2f} kg" for k, v in source_totals.items()])

    prompt = (
        f"You are an expert ESG sustainability intelligence agent for ReLoop AI.\n"
        f"Analyze the following real-time circular waste aggregates and output exactly ONE short paragraph "
        f"of ESG insight. Keep it under 60 words. Do not use any markdown formatting, do not invent or extrapolate any "
        f"numbers or statistics not present in the data, and make it professional, clear, and actionable.\n\n"
        f"Waste volume by material type: {material_summary}\n"
        f"Waste volume by source location: {source_summary}\n"
    )

    client = OpenAI(api_key=api_key)

    # Retry up to 1 time for transient errors (total of 2 attempts)
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a professional ESG auditor. You provide factual, concise insights "
                            "on waste aggregates. Never use markdown formatting. Always output exactly "
                            "one short paragraph."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.3,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )
            insight_text = response.choices[0].message.content.strip()
            # Clean up newlines if any
            insight_text = " ".join(insight_text.split())
            return insight_text
        except (APITimeoutError, APIConnectionError) as e:
            logger.warning(
                f"Transient network error on LLM attempt {attempt}/{max_attempts}: {type(e).__name__}: {str(e)}"
            )
            if attempt == max_attempts:
                logger.error(
                    f"LLM call failed after {max_attempts} attempts due to transient error: "
                    f"{type(e).__name__}: {str(e)}"
                )
                return None
            time.sleep(1)
        except APIError as e:
            logger.error(f"OpenAI API Error (Non-transient): {type(e).__name__}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during LLM generation: {type(e).__name__}: {str(e)}")
            return None
    return None
