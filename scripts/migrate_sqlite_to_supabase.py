import os
import sqlite3
import psycopg2
from psycopg2.extras import execute_batch

SQLITE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "eduverify.db"))
POSTGRES_CONN_STR = "postgresql://eduverify_admin:EduVerifyAICTE2024!Secure@db.ezwpjrcqtgomjlclghyx.supabase.co:5432/postgres?sslmode=require"

TABLE_ORDER = [
    "institutions",
    "programs",
    "users",
    "students",
    "duplicate_cases",
    "enrolments",
    "anomaly_alerts",
    "issued_credentials",
    "upload_batches",
    "upload_row_results",
    "validation_issues",
    "audit_events",
    "integration_jobs"
]

def migrate():
    print("=" * 60)
    print("Starting EduVerify SQLite -> Supabase PostgreSQL Migration")
    print(f"Source DB: {SQLITE_PATH}")
    print("Target DB: db.ezwpjrcqtgomjlclghyx.supabase.co (PostgreSQL 17)")
    print("=" * 60)

    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(POSTGRES_CONN_STR)
    pg_cur = pg_conn.cursor()

    stats = {}
    for table in TABLE_ORDER:
        sqlite_cur.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in sqlite_cur.fetchall()]
        if not columns:
            continue

        sqlite_cur.execute(f"SELECT * FROM {table};")
        rows = sqlite_cur.fetchall()
        if not rows:
            print(f"[INFO] Table {table:<22}: 0 rows (skipped)")
            continue

        BOOLEAN_COLS = {"is_active", "is_nri", "is_oci", "is_fn"}
        bool_indices = [i for i, c in enumerate(columns) if c in BOOLEAN_COLS]

        clean_rows = []
        for r in rows:
            r_list = list(r)
            for b_idx in bool_indices:
                if r_list[b_idx] is not None:
                    r_list[b_idx] = bool(r_list[b_idx])
            clean_rows.append(tuple(r_list))

        col_names = ", ".join(f'"{c}"' for c in columns)
        placeholders = ", ".join(["%s"] * len(columns))
        insert_query = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;'

        execute_batch(pg_cur, insert_query, clean_rows, page_size=200)
        pg_conn.commit()

        # Count in PG
        pg_cur.execute(f'SELECT count(*) FROM "{table}";')
        pg_count = pg_cur.fetchone()[0]
        stats[table] = (len(rows), pg_count)
        status_label = "[OK]" if len(rows) == pg_count else "[WARN]"
        print(f"{status_label} Table {table:<22}: SQLite={len(rows):<5} | Supabase Postgres={pg_count:<5}")

    sqlite_conn.close()
    pg_conn.close()

    print("=" * 60)
    print("All Tables Successfully Migrated to Cloud PostgreSQL (Supabase)!")
    print("=" * 60)


if __name__ == "__main__":
    migrate()
