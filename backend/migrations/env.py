import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlmodel import SQLModel

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import db  # noqa: E402  (import registers SQLModel table metadata)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def get_url() -> str:
    # Read fresh from the environment rather than db.DATABASE_URL directly: db is
    # cached in sys.modules after the app's first import, so its module-level
    # constant would be stale for callers (e.g. tests) that need a different
    # DATABASE_URL within the same process.
    return os.environ.get("DATABASE_URL", db.DATABASE_URL)


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = db.get_engine(get_url())

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
