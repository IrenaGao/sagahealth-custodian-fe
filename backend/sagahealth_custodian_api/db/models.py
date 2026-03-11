from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import declarative_base, Mapped, mapped_column

Base = declarative_base()


class User(Base):
    """
    A basic user entry to track membership ID.

    PARAMETERS
    ----------
    id : int
        sql ID
    email : str
        user email address
    password_hash : str
        bcrypt salted and hashed passsword
    lynx_member_id : str
        uuid generated client-side for the specific user to be used with Lynx.

    TODO: Perhaps generate this uuid server-side to not allow it to be improperly created?
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(index=True)  # TODO: Remove
    password_hash: Mapped[str] = mapped_column()
    lynx_member_id: Mapped[str] = mapped_column(index=True, unique=True)
    totp_secret: Mapped[str | None] = mapped_column(nullable=True, default=None)
    mfa_enabled: Mapped[bool] = mapped_column(default=False)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str | None] = mapped_column(unique=True, index=True, nullable=True, default=None)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True, default=None)
    pre_auth_token: Mapped[str | None] = mapped_column(unique=True, index=True, nullable=True, default=None)
    pre_auth_expires_at: Mapped[datetime | None] = mapped_column(nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
