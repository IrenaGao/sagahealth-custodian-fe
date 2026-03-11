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
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(index=True, unique=True)
    password_hash: Mapped[str] = mapped_column()
    lynx_member_id: Mapped[str] = mapped_column(index=True, unique=True)

