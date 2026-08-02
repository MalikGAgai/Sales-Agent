from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def format_iso8601(dt: datetime) -> str:
    """Format datetime object into standard ISO 8601 string."""
    return dt.isoformat()
