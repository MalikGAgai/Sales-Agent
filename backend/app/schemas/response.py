from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ResponseSchema(BaseModel, Generic[T]):
    """Standardized API response wrapper DTO."""

    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class ErrorResponseSchema(BaseModel):
    """Standardized error response DTO."""

    success: bool = False
    message: str
    detail: Optional[str] = None
