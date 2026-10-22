import os
import sys
import unittest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestSignalSenseAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["default_dataset"], "SWAN-SF")

    def test_datasets_list(self):
        res = self.client.get("/api/datasets")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]["id"], "swan")

    def test_swan_metadata(self):
        res = self.client.get("/api/datasets/swan/metadata")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["feature_count"], 24)
        self.assertEqual(data["continuous_test_shape"], [2400, 24])

    def test_swan_preview(self):
        res = self.client.get("/api/datasets/swan/preview?limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["rows"]), 10)
        self.assertIn("USFLUX", data["columns"])

    def test_detect_baseline(self):
        payload = {
            "dataset_id": "swan",
            "model_type": "baseline",
            "feature_name": "USFLUX",
            "alpha_mode": "manual",
            "alpha": 0.5,
            "anomaly_ratio": 14.5
        }
        res = self.client.post("/api/detect", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["model_type"], "baseline")
        self.assertEqual(data["alpha"], 0.5)
        self.assertIn("point_scores", data)
        self.assertIn("sequence_scores", data)
        self.assertIn("combined_scores", data)
        self.assertIn("threshold", data)
        self.assertTrue(len(data["detected_anomaly_indices"]) > 0)

    def test_recalculate(self):
        pt = [0.01, 0.05, 0.09]
        seq = [0.02, 0.04, 0.08]
        payload = {
            "dataset_id": "swan",
            "model_type": "baseline",
            "alpha": 0.7,
            "point_scores": pt,
            "sequence_scores": seq,
            "anomaly_ratio": 14.5
        }
        res = self.client.post("/api/recalculate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["alpha"], 0.7)
        self.assertEqual(len(data["combined_scores"]), 3)

    def test_comparison(self):
        res = self.client.get("/api/comparison?dataset_id=swan")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("models", data)
        self.assertEqual(len(data["models"]), 4)

    def test_auth_full_cycle(self):
        import uuid
        test_email = f"user_{uuid.uuid4().hex[:6]}@testsignalsense.com"
        test_pass = "SecurePass123!#"

        # 1. Register new user
        reg_payload = {
            "name": "Dr. Sarah Connor",
            "email": test_email,
            "password": test_pass,
            "confirm_password": test_pass,
        }
        reg_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(reg_res.status_code, 200)
        reg_data = reg_res.json()
        self.assertIn("access_token", reg_data)
        self.assertEqual(reg_data["user"]["email"], test_email.lower())
        token = reg_data["access_token"]

        # 2. Prevent duplicate email registration
        dup_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("already exists", dup_res.json()["detail"].lower())

        # 3. Successful login
        login_payload = {"email": test_email, "password": test_pass}
        login_res = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)

        # 4. Failed login with incorrect password
        bad_login = self.client.post("/api/auth/login", json={"email": test_email, "password": "WrongPassword!"})
        self.assertEqual(bad_login.status_code, 401)
        self.assertIn("Invalid email or password", bad_login.json()["detail"])

        # 5. Failed login with non-existent user
        nonexistent_login = self.client.post("/api/auth/login", json={"email": "nobody@testsignalsense.com", "password": "AnyPassword!"})
        self.assertEqual(nonexistent_login.status_code, 401)

        # 6. Access protected /api/auth/me with valid Bearer token
        headers = {"Authorization": f"Bearer {token}"}
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["user"]["email"], test_email.lower())

        # 7. Access /api/auth/me without token returns 401
        unauth_me = self.client.get("/api/auth/me")
        self.assertEqual(unauth_me.status_code, 401)

        # 8. Access /api/auth/me with invalid token returns 401
        bad_token_me = self.client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
        self.assertEqual(bad_token_me.status_code, 401)

if __name__ == "__main__":
    unittest.main()

