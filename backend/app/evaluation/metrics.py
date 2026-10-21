import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    roc_auc_score,
    confusion_matrix,
)
from typing import Dict, Any

def compute_evaluation_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    anomaly_scores: np.ndarray,
) -> Dict[str, Any]:
    """
    Computes rigorous classification & anomaly detection metrics on real ground-truth labels.
    Calculates Precision, Recall, F1, Specificity, False Alarm Rate, TSS, and ROC-AUC.
    """
    y_t = np.asarray(y_true).astype(int).reshape(-1)
    y_p = np.asarray(y_pred).astype(int).reshape(-1)
    scores = np.asarray(anomaly_scores).reshape(-1)

    acc = float(accuracy_score(y_t, y_p))
    prec, rec, f1, _ = precision_recall_fscore_support(y_t, y_p, average="binary", zero_division=0)

    cm = confusion_matrix(y_t, y_p)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        tn, fp, fn, tp = 0, 0, 0, 0

    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    false_alarm_rate = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    tss = float(rec + specificity - 1.0) # True Skill Statistic

    try:
        auc = float(roc_auc_score(y_t, scores))
    except Exception:
        auc = 0.5

    return {
        "accuracy": acc,
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "specificity": specificity,
        "false_alarm_rate": false_alarm_rate,
        "tss": tss,
        "auc_roc": auc,
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
        "total_samples": len(y_t),
        "anomaly_count": int(np.sum(y_t)),
        "normal_count": int(len(y_t) - np.sum(y_t)),
    }
