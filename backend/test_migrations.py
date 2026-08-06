import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

BACKEND_DIR = Path(__file__).resolve().parent


def test_alembic_upgrade_head_creates_expected_schema(tmp_path):
    db_path = tmp_path / "migration_test.db"
    database_url = f"sqlite:///{db_path}"

    previous_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = database_url
    try:
        config = Config(str(BACKEND_DIR / "alembic.ini"))
        config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
        command.upgrade(config, "head")
    finally:
        if previous_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_url

    engine = create_engine(database_url)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert {"user", "board", "column", "card"}.issubset(tables)

    user_columns = {col["name"] for col in inspector.get_columns("user")}
    assert user_columns == {"id", "email", "hashed_password", "created_at"}

    board_columns = {col["name"] for col in inspector.get_columns("board")}
    assert board_columns == {"id", "owner_id", "name"}

    column_columns = {col["name"] for col in inspector.get_columns("column")}
    assert column_columns == {"id", "board_id", "name", "position"}

    card_columns = {col["name"] for col in inspector.get_columns("card")}
    assert card_columns == {"id", "column_id", "title", "details", "position"}
