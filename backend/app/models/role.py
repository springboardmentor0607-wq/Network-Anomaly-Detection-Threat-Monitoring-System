import enum
import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    SOC_MANAGER = "SOC_MANAGER"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    VIEWER = "VIEWER"

class Role(Base):
    __tablename__ = "roles"

    name: Mapped[RoleEnum] = mapped_column(
        Enum(RoleEnum, name="role_enum"), unique=True, nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")
