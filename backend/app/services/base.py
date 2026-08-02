from typing import Generic, TypeVar
from app.repositories.base import BaseRepository

RepoType = TypeVar("RepoType", bound=BaseRepository)


class BaseService(Generic[RepoType]):
    """Abstract Base Business Service layer."""

    def __init__(self, repository: RepoType) -> None:
        self.repository = repository
