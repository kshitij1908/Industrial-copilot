"""
equipment_detector.py
~~~~~~~~~~~~~~~~~~~~~
Utilities for detecting and classifying industrial equipment tags
embedded in free-form text (SOPs, maintenance records, P&IDs, etc.).
"""

import re
from typing import List, Set

# ---------------------------------------------------------------------------
# Regex patterns that match common industrial equipment tag formats
# ---------------------------------------------------------------------------
EQUIPMENT_PATTERNS: List[str] = [
    r'\b[A-Z]{1,3}-\d{2,4}[A-Z]?\b',             # P-101, V-201, HX-301A
    r'\bPump\s+[A-Z]-\d+\b',                      # Pump P-101
    r'\bValve\s+[A-Z]{1,3}-\d+\b',                # Valve V-201
    r'\bCompressor\s+[A-Z]-\d+\b',                # Compressor C-301
    r'\bBoiler\s+[A-Z]-\d+\b',                    # Boiler B-401
    r'\bHeat\s+Exchanger\s+[A-Z]{1,2}-\d+\b',    # Heat Exchanger E-501
    r'\bTank\s+[A-Z]{1,2}-\d+\b',                 # Tank T-201
    r'\bMotor\s+[A-Z]{1,2}-\d+\b',                # Motor M-101
]

# ---------------------------------------------------------------------------
# Mapping from tag prefix to human-readable equipment type
# ---------------------------------------------------------------------------
EQUIPMENT_TYPE_MAP: dict = {
    "P":   "Pump",
    "V":   "Valve",
    "C":   "Compressor",
    "B":   "Boiler",
    "E":   "Heat Exchanger",
    "T":   "Tank",
    "M":   "Motor",
    "HX":  "Heat Exchanger",
    "FV":  "Flow Valve",
    "CV":  "Control Valve",
    "PSV": "Pressure Safety Valve",
    "FI":  "Flow Indicator",
    "TI":  "Temperature Indicator",
    "PI":  "Pressure Indicator",
    "LI":  "Level Indicator",
}

# Pre-compiled pattern to isolate just the tag portion from a longer match
_TAG_RE = re.compile(r"[A-Z]{1,3}-\d{2,4}[A-Z]?")


def detect_equipment_tags(text: str) -> List[str]:
    """Extract all unique, normalised equipment tags from *text*.

    Each pattern in :data:`EQUIPMENT_PATTERNS` is applied to the full text
    and any matches are reduced to their canonical tag form (e.g.
    ``"Pump P-101"`` becomes ``"P-101"``).

    Args:
        text: Raw text that may contain equipment references.

    Returns:
        Sorted list of unique equipment tag strings in uppercase.
    """
    if not text:
        return []

    found: Set[str] = set()

    for pattern in EQUIPMENT_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Normalise to uppercase and strip whitespace
            normalised = match.strip().upper()
            # Pull out the canonical tag segment (e.g. "HX-301A")
            tag_match = _TAG_RE.search(normalised)
            if tag_match:
                found.add(tag_match.group())

    return sorted(found)


def get_equipment_type(tag: str) -> str:
    """Infer the equipment type from a tag's alphabetic prefix.

    Args:
        tag: Equipment tag string such as ``"P-101"`` or ``"HX-302A"``.

    Returns:
        Human-readable equipment type string, or ``"Unknown"`` when the
        prefix cannot be mapped.
    """
    prefix_match = re.match(r"^([A-Z]{1,3})", tag.upper())
    if prefix_match:
        prefix = prefix_match.group(1)
        return EQUIPMENT_TYPE_MAP.get(prefix, "Unknown")
    return "Unknown"
