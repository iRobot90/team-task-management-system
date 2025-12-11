from typing import Iterable


class RoleFlagsMixin:
    """
    Convenience helpers for role-based checks mapped to the three roles:
    Admin, Manager, Member.
    """

    def _is_in_role(self, roles: Iterable[str]) -> bool:
        """Return True if the user's role matches any in the provided iterable."""
        return getattr(self, "role", None) in roles

    @property
    def is_admin(self) -> bool:
        return getattr(self, "role", None) == self.Role.ADMIN  # type: ignore[attr-defined]

    @property
    def is_manager(self) -> bool:
        return getattr(self, "role", None) == self.Role.MANAGER  # type: ignore[attr-defined]

    @property
    def is_member(self) -> bool:
        return getattr(self, "role", None) == self.Role.MEMBER  # type: ignore[attr-defined]

    def can_manage_users(self) -> bool:
        return self.is_admin

    def can_manage_tasks(self) -> bool:
        return self.is_admin or self.is_manager

    def can_assign_tasks(self) -> bool:
        return self.is_admin or self.is_manager

