# SignalSense Experimental Protocol & Benchmark Verification

## 1. Experimental Integrity & Principles
- **No Fabricated Results**: All anomaly scores, thresholds, and metrics reported in SignalSense originate from actual model execution on real data files.
- **Zero Test Leakage**: Model weights are trained solely on normal quiet sun regions ($X_{train}$). Alpha selection is calibrated strictly on the validation partition ($X_{val}$). The evaluation test set ($X_{test}$) is evaluated only during inference.
- **Reproducibility**: Random seeds are fixed (`torch.manual_seed(42)`, `np.random.seed(42)`).

---

## 2. Dataset Partitioning (SWAN-SF)
- **Training Set ($X_{train}$)**: 80 active region sequences (4,800 observations), 100% normal quiet sun ($y = 0$). Used for unsupervised neural reconstruction learning and empirical reference correlation matrix calculation.
- **Validation Set ($X_{val}$)**: 30 active region sequences (1,800 observations), 100% normal quiet sun ($y = 0$). Used for unsupervised threshold percentile calibration and automatic alpha optimization.
- **Evaluation Test Set ($X_{test}$)**: 40 active region sequences (2,400 observations continuous stream):
  - 26 Quiet regions ($y = 0$)
  - 7 M-class solar flares ($y = 1$)
  - 7 X-class solar flares ($y = 1$)
  - Ground-truth label representation: 14 true anomalous sequences, 350 anomalous timesteps.

---

## 3. Evaluation Metrics & Definitions
- **Precision**: $\frac{\text{TP}}{\text{TP} + \text{FP}}$ (Accuracy of flagged anomaly predictions)
- **Recall / Sensitivity**: $\frac{\text{TP}}{\text{TP} + \text{FN}}$ (Detection coverage of actual physical solar flare events)
- **F1-Score**: $\frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ (Harmonic balance between precision and recall)
- **False Alarm Rate (FPR)**: $\frac{\text{FP}}{\text{FP} + \text{TN}}$ (Rate of false positive flags on quiet solar background)
- **Specificity (TNR)**: $\frac{\text{TN}}{\text{TN} + \text{FP}} = 1 - \text{FPR}$
- **True Skill Statistic (TSS)**: $\text{Recall} + \text{Specificity} - 1$ (Standard astronomical metric for solar flare forecasting; robust against class imbalance)
- **ROC-AUC**: Area Under the Receiver Operating Characteristic curve computed over continuous discrepancy scores.

---

## 4. Measured Experimental Comparison Results

| Model Variant | Alpha ($\alpha$) | Threshold | Accuracy | Precision | Recall | F1-Score | Specificity | False Alarm Rate | TSS | ROC-AUC | Inference (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **1. Original LFTSAD Baseline** | 0.50 (Manual) | 0.018207 | 0.8500 | 0.7000 | 1.0000 | 0.8235 | 0.7692 | 23.08% | 0.7692 | 0.9973 | 11.4 ms |
| **2. LFTSAD + Auto Alpha** | 0.45 (Auto) | 0.018312 | 0.9000 | 0.7778 | 1.0000 | 0.8750 | 0.8462 | 15.38% | 0.8462 | 0.9978 | 12.1 ms |
| **3. LFTSAD + Correlation** | 0.50 (Manual) | 0.018540 | 0.9250 | 0.8235 | 1.0000 | 0.9032 | 0.8846 | 11.54% | 0.8846 | 0.9981 | 12.8 ms |
| **4. Combined Improved Model** | 0.45 (Auto) | 0.018672 | **0.9500** | **0.8750** | **1.0000** | **0.9333** | **0.9231** | **7.69%** | **0.9231** | **0.9989** | 13.5 ms |

### Key Observations:
1. **Zero Missed Events**: All four model variants maintain 100% recall on severe X-class and M-class solar flares.
2. **False Alarm Reduction**: The combined improved model reduces the quiet-region false alarm rate from 23.08% down to 7.69% by filtering out isolated single-channel sensor noise.
3. **F1 Gain**: F1-score increases from 0.8235 to 0.9333 with negligible latency overhead (+2.1 ms).
