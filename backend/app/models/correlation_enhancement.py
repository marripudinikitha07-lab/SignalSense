import numpy as np
from typing import Dict, Any, List, Tuple, Optional

class CrossVariableCorrelationEnhancement:
    """
    Cross-Variable Correlation Enhancement for Multivariate Time-Series.
    Models normal inter-channel empirical covariance and identifies observations
    where physical cross-variable relationships deviate synchronously.
    """
    def __init__(self, feature_names: Optional[List[str]] = None, gamma: float = 0.3):
        self.feature_names = feature_names or []
        self.gamma = gamma
        self.reference_corr: Optional[np.ndarray] = None
        self.mean_: Optional[np.ndarray] = None
        self.std_: Optional[np.ndarray] = None

    def fit(self, X_train: np.ndarray):
        """
        Fits reference correlation structure on normal training observations (N, M).
        """
        N, M = X_train.shape
        self.mean_ = np.mean(X_train, axis=0, keepdims=True)
        self.std_ = np.std(X_train, axis=0, keepdims=True) + 1e-6
        norm_X = (X_train - self.mean_) / self.std_

        # Compute empirical correlation matrix (M, M)
        cov = np.cov(norm_X, rowvar=False)
        std_diag = np.sqrt(np.diag(cov)) + 1e-6
        self.reference_corr = cov / np.outer(std_diag, std_diag)
        np.fill_diagonal(self.reference_corr, 1.0)
        return self

    def compute_discrepancy(self, X: np.ndarray) -> np.ndarray:
        """
        Computes instantaneous cross-variable deviation for each timestep t.
        Discrepancy is high when multiple physically coupled channels deviate in unison.
        """
        if self.reference_corr is None:
            self.fit(X)

        T, M = X.shape
        norm_X = (X - self.mean_) / self.std_

        # Prediction of channel i from its correlated partners:
        # Expected z_i = sum_{j != i} R_{ij} * z_j / sum_{j != i} |R_{ij}|
        abs_R = np.abs(self.reference_corr)
        norm_weights = np.sum(abs_R, axis=1, keepdims=True) - 1.0 + 1e-6

        # Coupled physical energy: weighted projection
        coupled_deviation = np.zeros(T, dtype=np.float32)
        for t in range(T):
            z_t = norm_X[t]
            # Cross-channel consistency score
            expected_z = (self.reference_corr @ z_t - z_t) / norm_weights.squeeze()
            residual = np.abs(z_t - expected_z)
            coupled_deviation[t] = np.mean(residual)

        # Normalize deviation to [0, 1] range
        min_d = np.min(coupled_deviation)
        max_d = np.max(coupled_deviation)
        if max_d > min_d:
            norm_deviation = (coupled_deviation - min_d) / (max_d - min_d)
        else:
            norm_deviation = np.zeros_like(coupled_deviation)

        return norm_deviation

    def enhance_scores(
        self,
        base_combined_scores: np.ndarray,
        X: np.ndarray,
        gamma: Optional[float] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Enhances LFTSAD combined scores using cross-variable correlation discrepancy:
        Score_enhanced(t) = BaseScore(t) * (1.0 + gamma * Discrepancy(t))
        """
        g = self.gamma if gamma is None else gamma
        corr_discrepancy = self.compute_discrepancy(X)
        enhanced_scores = base_combined_scores * (1.0 + g * corr_discrepancy)
        return enhanced_scores, corr_discrepancy

    def get_top_correlated_pairs(self, target_idx: int = 0, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Returns top correlated physical parameters for the target variable.
        """
        if self.reference_corr is None or target_idx >= self.reference_corr.shape[0]:
            return []

        corrs = self.reference_corr[target_idx].copy()
        corrs[target_idx] = -999.0 # exclude self
        top_indices = np.argsort(np.abs(corrs))[::-1][:top_k]

        results = []
        for idx in top_indices:
            name = self.feature_names[idx] if idx < len(self.feature_names) else f"Feature_{idx}"
            results.append({
                "feature_index": int(idx),
                "name": name,
                "correlation": float(self.reference_corr[target_idx, idx]),
            })
        return results
