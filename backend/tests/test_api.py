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

if __name__ == "__main__":
    unittest.main()
