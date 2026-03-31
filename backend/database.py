import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "portfolio.db")


def _get_database_url():
    url = os.getenv("DATABASE_URL", "").strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def using_postgres():
    return bool(_get_database_url())


@contextmanager
def get_conn():
    if using_postgres():
        conn = psycopg2.connect(_get_database_url(), sslmode="require")
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


def _now_expr():
    return "CURRENT_TIMESTAMP" if using_postgres() else "datetime('now')"


def init_db():
    with get_conn() as conn:
        cur = conn.cursor()
        if using_postgres():
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS contacts (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS stats (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                INSERT INTO stats (key, value)
                VALUES ('visitors', '0')
                ON CONFLICT (key) DO NOTHING
                """
            )
        else:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS stats (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
            cur.execute(
                """
                INSERT OR IGNORE INTO stats (key, value)
                VALUES ('visitors', '0')
                """
            )
        conn.commit()


def save_contact(name, email, message):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"""
            INSERT INTO contacts (name, email, message, created_at)
            VALUES (%s, %s, %s, {_now_expr()})
            """
            if using_postgres()
            else """
            INSERT INTO contacts (name, email, message, created_at)
            VALUES (?, ?, ?, datetime('now'))
            """,
            (name, email, message),
        )
        conn.commit()


def list_contacts():
    with get_conn() as conn:
        if using_postgres():
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT name, email, message, created_at
                FROM contacts
                ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()
            return [
                {
                    "name": row["name"],
                    "email": row["email"],
                    "message": row["message"],
                    "created_at": row["created_at"].isoformat()
                    if hasattr(row["created_at"], "isoformat")
                    else str(row["created_at"]),
                }
                for row in rows
            ]

        cur = conn.cursor()
        cur.execute(
            """
            SELECT name, email, message, created_at
            FROM contacts
            ORDER BY created_at DESC
            """
        )
        rows = cur.fetchall()
        return [
            {
                "name": row["name"],
                "email": row["email"],
                "message": row["message"],
                "created_at": row["created_at"],
            }
            for row in rows
        ]


def increment_visitors():
    with get_conn() as conn:
        cur = conn.cursor()
        if using_postgres():
            cur.execute(
                """
                UPDATE stats
                SET value = (COALESCE(NULLIF(value, ''), '0')::int + 1)::text
                WHERE key = 'visitors'
                """
            )
            cur.execute("SELECT value FROM stats WHERE key = 'visitors'")
            visitors = int(cur.fetchone()[0])
        else:
            cur.execute(
                """
                UPDATE stats
                SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
                WHERE key = 'visitors'
                """
            )
            cur.execute("SELECT value FROM stats WHERE key = 'visitors'")
            visitors = int(cur.fetchone()["value"])
        conn.commit()
        return visitors


def get_visitors():
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT value FROM stats WHERE key = 'visitors'")
        row = cur.fetchone()
        if not row:
            return 0
        if using_postgres():
            return int(row[0])
        return int(row["value"])
