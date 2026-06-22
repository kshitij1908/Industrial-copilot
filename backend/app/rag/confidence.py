import re
from typing import List


def extract_llm_confidence(answer_text: str) -> tuple[int, str]:
    """Extract the ``[CONFIDENCE: XX]`` tag from an LLM response.

    Returns:
        A 2-tuple of (confidence_int, cleaned_answer) where
        ``cleaned_answer`` has the confidence tag stripped out.
        Falls back to ``(75, answer_text)`` when no tag is found.
    """
    pattern = r"\[CONFIDENCE:\s*(\d+)\]"
    match = re.search(pattern, answer_text)
    if match:
        confidence = min(100, max(0, int(match.group(1))))
        cleaned = re.sub(pattern, "", answer_text).strip()
        return confidence, cleaned
    # Default when the LLM omitted the tag
    return 75, answer_text.strip()


def calculate_confidence(
    retrieval_scores: List[float],
    llm_confidence: int,
    num_sources: int,
) -> int:
    """Composite confidence score combining retrieval quality and LLM self-rating.

    Weights:
        60 % — mean cosine-similarity of retrieved chunks (0-100 normalised)
        30 % — LLM self-reported confidence (0-100)
        10 % — source-diversity bonus (capped at 10 pts, 2 pts per unique source)

    Args:
        retrieval_scores: List of similarity scores in [0, 1] for retrieved chunks.
        llm_confidence:   Self-reported confidence extracted from the LLM answer.
        num_sources:      Number of distinct source documents contributing to the answer.

    Returns:
        Integer confidence in [0, 100].
    """
    if not retrieval_scores:
        # No retrieval evidence — penalise heavily
        return max(0, llm_confidence - 20)

    mean_sim = sum(retrieval_scores) / len(retrieval_scores)
    sim_score = int(mean_sim * 100)  # normalise to 0-100

    # Source diversity bonus: 2 pts per unique source, max 10 pts
    source_bonus = min(10, num_sources * 2)

    composite = int(
        sim_score * 0.60
        + llm_confidence * 0.30
        + source_bonus * 0.10
    )
    return min(100, max(0, composite))


def get_confidence_label(score: int) -> str:
    """Map a numeric confidence score to a human-readable label.

    Returns:
        ``'high'`` for score >= 80, ``'medium'`` for >= 60, else ``'low'``.
    """
    if score >= 80:
        return "high"
    elif score >= 60:
        return "medium"
    return "low"
