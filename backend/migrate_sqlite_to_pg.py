"""
One-shot migration: SQLite (team.db) -> PostgreSQL (team_db)
Run once: python migrate_sqlite_to_pg.py
"""
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import os

load_dotenv()

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "team.db")
PG_DSN = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/team_db")

# Tables in insertion order (respects FK dependencies)
TABLES = [
    "users",
    "mse",
    "snp",
    "product_category",
    "mse_product",
    "product_version",
    "transaction",
    "transaction_conflict",
    "claim",
    "ocr_document",
    "partnership",
    "notification",
    "notification_preferences",
    "otp_verification",
    "system_audit_log",
]

# Columns that were stored as 0/1 integers in SQLite but are Boolean in PostgreSQL
BOOL_COLUMNS = {
    "users":                    {"is_active"},
    "mse_product":              {"is_active"},
    "ocr_document":             {"is_verified"},
    "partnership":              {"mse_consent", "snp_consent"},
    "notification":             {"is_read"},
    "notification_preferences": {"email_enabled", "sms_enabled", "in_app_enabled", "marketing_enabled"},
}

def cast_row(table, columns, row):
    """Convert integer 0/1 to Python bool for boolean columns."""
    bool_cols = BOOL_COLUMNS.get(table, set())
    if not bool_cols:
        return row
    result = list(row)
    for i, col in enumerate(columns):
        if col in bool_cols and result[i] is not None:
            result[i] = bool(result[i])
    return tuple(result)

def migrate():
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(PG_DSN)
    pg_conn.autocommit = False
    pg_cur = pg_conn.cursor()

    total_migrated = 0

    for table in TABLES:
        # Check table exists in SQLite
        sqlite_cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
        )
        if not sqlite_cur.fetchone():
            print(f"  [{table}] not found in SQLite, skipping.")
            continue

        sqlite_cur.execute(f"SELECT * FROM [{table}]")
        rows = sqlite_cur.fetchall()

        if not rows:
            print(f"  [{table}] 0 rows — nothing to migrate.")
            continue

        columns = [desc[0] for desc in sqlite_cur.description]
        values = [cast_row(table, columns, tuple(row)) for row in rows]

        col_str = ", ".join(f'"{c}"' for c in columns)
        placeholders = "(" + ", ".join(["%s"] * len(columns)) + ")"

        insert_sql = (
            f'INSERT INTO "{table}" ({col_str}) VALUES %s '
            f'ON CONFLICT DO NOTHING'
        )

        try:
            execute_values(pg_cur, insert_sql, values, template=placeholders)
            pg_conn.commit()
            print(f"  [{table}] {len(rows)} rows migrated.")
            total_migrated += len(rows)
        except Exception as e:
            pg_conn.rollback()
            print(f"  [{table}] ERROR: {e}")

    # Reset all sequences so next INSERT gets the correct next ID
    print("\nResetting PostgreSQL sequences...")
    for table in TABLES:
        pg_cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
              AND column_default LIKE 'nextval%%'
        """, (table,))
        pk_rows = pg_cur.fetchall()
        for (col,) in pk_rows:
            seq_name = f"{table}_{col}_seq"
            pg_cur.execute(
                f'SELECT setval(\'{seq_name}\', COALESCE((SELECT MAX("{col}") FROM "{table}"), 1))'
            )
            pg_conn.commit()
            print(f"  Reset: {seq_name}")

    sqlite_conn.close()
    pg_cur.close()
    pg_conn.close()

    print(f"\nDone. {total_migrated} total rows migrated to PostgreSQL.")

if __name__ == "__main__":
    migrate()
