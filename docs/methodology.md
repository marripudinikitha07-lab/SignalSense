# SignalSense Methodology: LFTSAD and Proposed Research Extensions

## 1. Research Motivation & Core Principles

Time-series anomaly detection in observational astrophysics (such as solar flare forecasting) and industrial instrumentation demands models that operate with low latency, require minimal supervision, and simultaneously detect two distinct forms of anomalous behavior:
1. **Point-Level Spikes**: Sudden impulse shocks or anomalous sensor readings at isolated timestamps.
2. **Sequence-Level Distortions**: Contextual pattern deformations or morphological drifts over surrounding temporal windows.

Traditional deep reconstruction models (such as Recurrent Neural Networks and Self-Attention Transformers) exhibit high computational complexity ($O(L^2)$) and typically minimize an isotropic point reconstruction loss, failing to decouple instant spikes from contextual rhythm changes.

The **LFTSAD** (Lightweight and Fast Time-Series Anomaly Detection via Point-Level and Sequence-Level Reconstruction Discrepancy) architecture solves this by using linear Multi-Layer Perceptrons (MLPs) over sub-series patches, achieving $O(L)$ linear complexity while calculating dual-scale reconstruction discrepancies.

---

## 2. Mathematical Formulation of the LFTSAD Baseline

Given a multivariate observation stream $X \in \mathbb{R}^{B \times L \times M}$ with batch size $B$, window length $L$, and $M$ physical channels:

### 2.1 Reversible Instance Normalization (RevIN)
To handle non-stationary shifts:
$$\tilde{X} = \frac{X - \mu_X}{\sigma_X} \odot \gamma + \beta$$
where $\mu_X$ and $\sigma_X$ represent the instance mean and standard deviation along the temporal dimension, and $\gamma, \beta$ are learnable affine parameters.

### 2.2 Dual Patch Decomposition
- **Point-Level Encoders**: The normalized stream is segmented into non-overlapping patches of sizes $P \in \{3, 5, 7\}$. An intra-patch MLP models local point dependencies while an inter-patch MLP models patch-to-patch transitions, generating reconstructed series $\hat{X}_{series}$ and prior $\hat{X}_{prior}$.
- **Sequence-Level Encoders**: A coarser patch grouping $P_{seq} \in \{6\}$ with subsequence dimension $S_{seq} = 5$ generates contextual sequence series $\hat{S}_{series}$ and prior $\hat{S}_{prior}$.

### 2.3 Reconstruction Discrepancy Scores
At each timestep $t \in [1, L]$:
- **Point-Level Discrepancy**:
  $$\text{PointScore}(t) = \text{Softmax}\left(\frac{1}{M}\sum_{m=1}^M \|\hat{X}_{series}(t, m) - \hat{X}_{prior}(t, m)\|^2\right)$$
- **Sequence-Level Discrepancy**:
  $$\text{SequenceScore}(t) = \text{Softmax}\left(\frac{1}{M}\sum_{m=1}^M \|\hat{S}_{series}(t, m) - \hat{S}_{prior}(t, m)\|^2\right)$$

### 2.4 Score Fusion via Alpha ($\alpha$)
The final combined anomaly score is computed as:
$$\text{CombinedScore}(t) = \alpha \cdot \text{PointScore}(t) + (1 - \alpha) \cdot \text{SequenceScore}(t)$$
where $\alpha \in [0, 1]$ governs the relative sensitivity between point-level impulses and sequence-level pattern deformations.

---

## 3. Proposed Research Improvements in SignalSense

### 3.1 Unsupervised Automatic Alpha Selection
In the original baseline, $\alpha$ is manually fixed (typically $\alpha = 0.5$). In SignalSense, we formulate an unsupervised calibration criterion evaluated on held-out normal validation sequences ($X_{val} \in \mathbb{R}^{30 \times 60 \times 24}$):
$$\alpha^* = \arg\max_{\alpha \in [0.1, 0.9]} \left[ \frac{\text{Percentile}_{95}(S_{\alpha}) - \text{Percentile}_{50}(S_{\alpha})}{\text{Percentile}_{50}(S_{\alpha}) + \epsilon} + \lambda \cdot \text{Var}(S_{\alpha} \mid S_{\alpha} \ge \text{Percentile}_{95}) \right]$$
This criterion automatically determines whether the dataset's anomalies are dominated by point spikes (yielding $\alpha > 0.5$) or contextual deformations (yielding $\alpha < 0.5$) without peeking at test labels.

### 3.2 Cross-Variable Correlation Enhancement
Physical multivariate streams (such as the 24 photospheric parameters in SWAN-SF) exhibit known physical couplings. An isolated spike in one channel without corresponding response in correlated physical parameters is frequently sensor noise.

1. **Reference Empirical Correlation**: From normal training stream $X_{train}$, compute:
   $$R \in \mathbb{R}^{M \times M}, \quad R_{ij} = \frac{\text{Cov}(X_i, X_j)}{\sigma_i \sigma_j}$$
2. **Coupled Deviation**: At each timestep $t$, predict the expected normalized state $\hat{z}_i(t)$ from its correlated partners:
   $$\hat{z}_i(t) = \frac{\sum_{j \neq i} R_{ij} z_j(t)}{\sum_{j \neq i} |R_{ij}|}$$
3. **Correlation-Enhanced Scoring**:
   $$\Delta_{corr}(t) = \frac{1}{M}\sum_{i=1}^M |z_i(t) - \hat{z}_i(t)|$$
   $$\text{Score}_{enhanced}(t) = \text{CombinedScore}(t) \times \left(1 + \gamma \cdot \text{Normalized}(\Delta_{corr}(t))\right)$$
   where $\gamma = 0.3$ is the correlation penalty weight.
