from sqlalchemy.orm import declarative_base, Mapped, mapped_column

Base = declarative_base()


class User(Base):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(index=True)
    password_hash: Mapped[str] = mapped_column()
    lynx_memebr_id: Mapped[str] = mapped_column()
