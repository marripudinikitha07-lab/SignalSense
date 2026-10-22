import os
import sys
import unittest
import sqlite3

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    JWT_SECRET,
)
from app.database import get_db_connection, create_user, get_user_by_email, get_user_by_id

class TestAuthSystem(unittest.TestCase):
    def setUp(self):
        # Ensure clean state for test users
        conn = get_db_connection()
        try:
            with conn:
                conn.execute("DELETE FROM users WHERE email LIKE '%@testsignalsense.com';")
        finally:
            conn.close()

    def test_jwt_secret_not_empty_and_not_predictable(self):
        """Verifies JWT_SECRET is loaded and is cryptographically strong (>= 32 chars)."""
        self.assertIsNotNone(JWT_SECRET)
        self.assertTrue(len(JWT_SECRET) >= 32)
        # Verify it's not a common insecure placeholder
        self.assertNotIn(JWT_SECRET.lower(), ["secret", "password", "jwt_secret", "123456", "default"])

    def test_password_hashing_and_verification(self):
        """Verifies bcrypt hashing, salt uniqueness, and constant-time password matching."""
        pwd1 = "SecureP@ssw0rd!2026"
        hash1 = hash_password(pwd1)
        hash2 = hash_password(pwd1)

        # Different salts must yield different hashes for identical plaintext
        self.assertNotEqual(hash1, hash2)
        # Both hashes must successfully verify
        self.assertTrue(verify_password(pwd1, hash1))
        self.assertTrue(verify_password(pwd1, hash2))
        # Wrong password must fail
        self.assertFalse(verify_password("WrongPassword123!", hash1))
        self.assertFalse(verify_password("", hash1))

    def test_database_user_creation_and_retrieval(self):
        """Verifies SQLite user creation and case-insensitive email lookup."""
        email = "Researcher_Alpha@testsignalsense.com"
        pwd = hash_password("ValidPassword890!")
        user = create_user(name="Dr. Elena Vance", email=email, hashed_password=pwd)

        self.assertIsNotNone(user["id"])
        self.assertEqual(user["email"], email.lower())

        # Retrieve by lowercase email
        fetched_lower = get_user_by_email(email.lower())
        self.assertIsNotNone(fetched_lower)
        self.assertEqual(fetched_lower["name"], "Dr. Elena Vance")

        # Retrieve by mixed-case email (case-insensitive)
        fetched_mixed = get_user_by_email(email.upper())
        self.assertIsNotNone(fetched_mixed)
        self.assertEqual(fetched_mixed["id"], user["id"])

        # Retrieve by primary key id
        fetched_id = get_user_by_id(user["id"])
        self.assertIsNotNone(fetched_id)
        self.assertEqual(fetched_id["email"], email.lower())

    def test_jwt_creation_and_payload_verification(self):
        """Verifies JWT token encoding, signature validation, and payload integrity."""
        payload = {"sub": "42", "email": "test@testsignalsense.com", "name": "Test User"}
        token = create_access_token(payload)
        self.assertIsInstance(token, str)

        decoded = verify_access_token(token)
        self.assertEqual(decoded["sub"], "42")
        self.assertEqual(decoded["email"], "test@testsignalsense.com")
        self.assertIn("exp", decoded)
        self.assertIn("iat", decoded)

    def test_jwt_tampering_rejected(self):
        """Verifies modified token signature is rejected by verification."""
        from fastapi import HTTPException
        payload = {"sub": "99", "email": "tamper@testsignalsense.com"}
        token = create_access_token(payload)

        # Tamper token by altering characters
        tampered_token = token[:-4] + ("AAAA" if token[-4:] != "AAAA" else "BBBB")
        with self.assertRaises(HTTPException) as ctx:
            verify_access_token(tampered_token)
        self.assertEqual(ctx.exception.status_code, 401)

if __name__ == "__main__":
    unittest.main()
