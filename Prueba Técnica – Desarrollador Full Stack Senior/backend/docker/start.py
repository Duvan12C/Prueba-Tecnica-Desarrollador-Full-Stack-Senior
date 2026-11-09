import os
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import URL, create_engine


def main() -> None:
    master_url = URL.create(
        "mssql+pyodbc",
        username="sa",
        password=os.environ["DOCSPACE_SQL_PASSWORD"],
        host="db",
        port=1433,
        database="master",
        query={"driver": "ODBC Driver 18 for SQL Server", "TrustServerCertificate": "yes"},
    )
    engine = create_engine(master_url, isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("IF DB_ID(N'DocSpace') IS NULL CREATE DATABASE [DocSpace]")
    finally:
        engine.dispose()

    os.environ["DATABASE_URL"] = master_url.set(database="DocSpace").render_as_string(hide_password=False)
    command.upgrade(Config("alembic.ini"), "head")
    args = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    os.execv(sys.executable, args)


if __name__ == "__main__":
    main()
