# models/user.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from models.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # リレーション（逆参照）
    images: Mapped[list["ImageRecord"]] = relationship(back_populates="user", cascade="all, delete")
