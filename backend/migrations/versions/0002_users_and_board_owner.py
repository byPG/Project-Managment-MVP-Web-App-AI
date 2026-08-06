"""create user table and board.owner_id

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-06

"""
import os
from datetime import datetime, timezone
from typing import Sequence, Union

import bcrypt
import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MAX_PASSWORD_BYTES = 72


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("hashed_password", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)

    op.add_column("board", sa.Column("owner_id", sa.Integer(), nullable=True))

    _backfill_owner_id()

    with op.batch_alter_table("board") as batch_op:
        batch_op.alter_column("owner_id", nullable=False)
        batch_op.create_foreign_key("fk_board_owner_id_user", "user", ["owner_id"], ["id"])


def downgrade() -> None:
    with op.batch_alter_table("board") as batch_op:
        batch_op.drop_constraint("fk_board_owner_id_user", type_="foreignkey")
        batch_op.drop_column("owner_id")

    op.drop_index("ix_user_email", table_name="user")
    op.drop_table("user")


def _backfill_owner_id() -> None:
    # Boards created before this migration (the pre-auth single-board MVP)
    # have no owner. Assign them to a demo user rather than orphaning the
    # data, so upgrading an existing deployment doesn't lose its board.
    connection = op.get_bind()

    user_table = sa.table(
        "user",
        sa.column("id", sa.Integer),
        sa.column("email", sqlmodel.sql.sqltypes.AutoString),
        sa.column("hashed_password", sqlmodel.sql.sqltypes.AutoString),
        sa.column("created_at", sa.DateTime),
    )
    board_table = sa.table(
        "board",
        sa.column("id", sa.Integer),
        sa.column("owner_id", sa.Integer),
    )

    orphaned_boards = connection.execute(
        sa.select(board_table.c.id).where(board_table.c.owner_id.is_(None)),
    ).fetchall()
    if not orphaned_boards:
        return

    demo_email = os.environ.get("DEMO_EMAIL", "demo@kanban.app")
    demo_password = os.environ.get("DEMO_PASSWORD", "password123")
    bcrypt_rounds = int(os.environ.get("BCRYPT_ROUNDS", "12"))

    existing_user = connection.execute(
        sa.select(user_table.c.id).where(user_table.c.email == demo_email),
    ).first()

    if existing_user is not None:
        demo_user_id = existing_user.id
    else:
        hashed_password = bcrypt.hashpw(
            demo_password.encode("utf-8")[:MAX_PASSWORD_BYTES],
            bcrypt.gensalt(rounds=bcrypt_rounds),
        ).decode("utf-8")
        connection.execute(
            sa.insert(user_table).values(
                email=demo_email,
                hashed_password=hashed_password,
                created_at=datetime.now(timezone.utc),
            ),
        )
        # inserted_primary_key is unreliable for a bare sa.table() insert
        # against SQLite (no autoincrement metadata attached), so re-fetch
        # the row we just created by its unique email instead.
        demo_user_id = connection.execute(
            sa.select(user_table.c.id).where(user_table.c.email == demo_email),
        ).scalar_one()

    connection.execute(
        sa.update(board_table).where(board_table.c.owner_id.is_(None)).values(owner_id=demo_user_id),
    )
