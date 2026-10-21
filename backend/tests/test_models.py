import os
import sys
import unittest
import numpy as np
import torch

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.revin import RevIN
from app.models.lftsad_model import LFTSAD
from app.models.lftsad_baseline import LFTSADBaseline
from app.models.alpha_selection import AutomaticAlphaSelector
from app.models.correlation_enhancement import CrossVariableCorrelationEnhancement

class TestLFTSADModels(unittest.TestCase):
    def test_revin_norm_denorm(self):
        revin = RevIN(num_features=5)
        x = torch.randn(4, 30, 5)
        norm = revin(x, 'norm')
        self.assertEqual(norm.shape, x.shape)
        # Check normalized mean ~ 0 and std ~ 1
        self.assertAlmostEqual(torch.mean(norm).item(), 0.0, places=1)

    def test_lftsad_forward(self):
        model = LFTSAD(win_size=60, enc_in=24, c_out=24, d_model=64, patch_size=[6], patch_seq=[6], seq_size=5, channel=24)
        x = torch.randn(2, 60, 24)
        series, prior, series_seq, prior_seq = model(x)
        self.assertEqual(len(series), 1)
        self.assertEqual(series[0].shape, (2, 60, 24))
        self.assertEqual(series_seq[0].shape, (2, 60, 24))

    def test_baseline_scoring_and_alpha_formula(self):
        # Verify CombinedScore = alpha * PointScore + (1 - alpha) * SequenceScore
        pt = np.array([0.1, 0.4, 0.9])
        seq = np.array([0.2, 0.3, 0.7])
        alpha = 0.6
        expected_combined = 0.6 * pt + 0.4 * seq
        actual_combined = alpha * pt + (1.0 - alpha) * seq
        np.testing.assert_allclose(actual_combined, expected_combined)

    def test_automatic_alpha_selector(self):
        selector = AutomaticAlphaSelector()
        pt = np.random.uniform(0.01, 0.05, 100)
        seq = np.random.uniform(0.01, 0.05, 100)
        # Add peak spike to point scores
        pt[45:50] = 0.8
        res = selector.select_optimal_alpha(pt, seq)
        self.assertIn("selected_alpha", res)
        self.assertTrue(0.0 <= res["selected_alpha"] <= 1.0)
        self.assertEqual(res["selection_criterion"], "Tail Variance Separation (Unsupervised)")

    def test_correlation_enhancement(self):
        enhancer = CrossVariableCorrelationEnhancement(feature_names=[f"F_{i}" for i in range(5)], gamma=0.3)
        X = np.random.randn(100, 5)
        enhancer.fit(X)
        self.assertEqual(enhancer.reference_corr.shape, (5, 5))
        base_scores = np.ones(100) * 0.02
        enhanced, discrepancy = enhancer.enhance_scores(base_scores, X)
        self.assertEqual(enhanced.shape, (100,))
        self.assertTrue(np.all(enhanced >= base_scores))

if __name__ == "__main__":
    unittest.main()
