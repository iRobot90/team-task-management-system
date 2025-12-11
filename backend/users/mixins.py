from typing import Iterable
from django.db import models


class RoleFlagsMixin(models.Model):
    """
    Convenience helpers that expose simple role categories (admin/manager/member)
    independent of the underlying `User.Role` TextChoices.

    This class maps detailed role values into the three canonical categories
    using a small set of keywords. It keeps permission checks stable while the
    project's role naming may be more specific.
    """

    def _role_category(self) -> str | None:
        """Return one of: 'admin', 'manager', 'member', or None if no role."""
        role_val = getattr(self, "role", None)
        if not role_val:
            return None

        rv = str(role_val).upper()

        # admin-like roles
        for kw in ("ADMIN", "SYSTEM", "DIRECTOR", "SECRETARY"):
            if kw in rv:
                return "admin"

        # manager-like roles
        for kw in ("MANAGER", "OFFICER", "DEPARTMENT", "CHIEF"):
            if kw in rv:
                return "manager"

        # fallback to member
        return "member"

    @property
    def is_admin(self) -> bool:
        return self._role_category() == "admin"

    @property
    def is_manager(self) -> bool:
        return self._role_category() == "manager"

    @property
    def is_member(self) -> bool:
        return self._role_category() == "member"

    def can_manage_users(self) -> bool:
        return self.is_admin

    def can_manage_tasks(self) -> bool:
        return self.is_admin or self.is_manager

    def can_assign_tasks(self) -> bool:
        return self.is_admin or self.is_manager

    class Meta:
        abstract = True
