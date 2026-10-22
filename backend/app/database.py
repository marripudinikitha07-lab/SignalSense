import sqlite3
import os
from typing import Optional, Dict, Any

# Path to SQLite database file
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(BACKEND_DIR, "signalsense_auth.db")

def get_db_connection() -> sqlite3.Connection:
    """Creates a thread-safe connection to the SQLite database with row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    hashed_password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
    finally:
        conn.close()

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user record by email (case-insensitive)."""
    if not email:
        return None
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ? LIMIT 1;", (email.strip().lower(),))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a user record by primary key id."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ? LIMIT 1;", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def create_user(name: str, email: str, hashed_password: str) -> Dict[str, Any]:
    """Inserts a new user record into SQLite."""
    clean_email = email.strip().lower()
    clean_name = name.strip()
    conn = get_db_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?);",
                (clean_name, clean_email, hashed_password)
            )
            new_id = cursor.lastrowid
        return {
            "id": new_id,
            "name": clean_name,
            "email": clean_email,
        }
    finally:
        conn.close()

# Auto-initialize database on module import
init_db()
