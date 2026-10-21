import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDatasetMetadata, runDetection, recalculateWithAlpha, autoSelectAlpha } from '../services/api';

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [selectedDataset, setSelectedDataset] = useState('swan');
  const [datasetMeta, setDatasetMeta] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState('USFLUX');
  const [activeModel, setActiveModel] = useState('baseline');
  const [alphaMode, setAlphaMode] = useState('manual');
  const [alpha, setAlpha] = useState(0.5);
  const [autoAlphaMeta, setAutoAlphaMeta] = useState(null);
  const [correlationWeight, setCorrelationWeight] = useState(0.3);
  const [timeRange, setTimeRange] = useState([0, 500]); // default display window

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // Load dataset metadata when dataset changes
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const meta = await fetchDatasetMetadata(selectedDataset);
        if (isMounted) {
          setDatasetMeta(meta);
          if (meta.feature_names && meta.feature_names.length > 0) {
            setSelectedFeature(meta.feature_names[0]);
          }
        }
      } catch (err) {
        console.warn('Backend not ready or metadata fetch failed:', err.message);
      }
    }
    loadMeta();
    return () => { isMounted = false; };
  }, [selectedDataset]);

  // Execute actual detection
  const executeDetection = async (customConfig = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = {
        dataset_id: selectedDataset,
        model_type: activeModel,
        feature_name: selectedFeature,
        alpha_mode: alphaMode,
        alpha: Number(alpha),
        correlation_weight: Number(correlationWeight),
        ...customConfig,
      };

      const res = await runDetection(config);
      setResults(res);

      if (res.alpha !== undefined) {
        setAlpha(res.alpha);
      }
      if (res.auto_alpha_meta) {
        setAutoAlphaMeta(res.auto_alpha_meta);
      }

      if (res.detected_anomaly_indices && res.detected_anomaly_indices.length > 0) {
        setSelectedPointIndex(res.detected_anomaly_indices[0]);
      } else {
        setSelectedPointIndex(0);
      }

      // Adjust timeRange window to dataset length if needed
      if (res.total_observations) {
        setTimeRange([0, Math.min(res.total_observations, 500)]);
      }

      return res;
    } catch (err) {
      const msg = err.message || 'Detection failed. Ensure the Python backend is running on http://127.0.0.1:8000.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate combined scores when manual alpha changes
  const updateAlphaManually = async (newAlpha) => {
    const numericAlpha = Math.max(0, Math.min(1, parseFloat(newAlpha)));
    setAlpha(numericAlpha);
    setAlphaMode('manual');

    if (!results || !results.point_scores || !results.sequence_scores) {
      return;
    }

    try {
      const res = await recalculateWithAlpha({
        dataset_id: selectedDataset,
        model_type: activeModel,
        alpha: numericAlpha,
        point_scores: results.point_scores,
        sequence_scores: results.sequence_scores,
        correlation_scores: results.correlation_scores || null,
        correlation_weight: Number(correlationWeight),
      });

      setResults(prev => ({
        ...prev,
        alpha: res.alpha,
        combined_scores: res.combined_scores,
        predictions: res.predictions,
        threshold: res.threshold,
        detected_anomaly_indices: res.detected_anomaly_indices,
        total_anomalies: res.total_anomalies,
      }));
    } catch (err) {
      console.error('Recalculation error:', err);
    }
  };

  // Auto select alpha
  const triggerAutoAlpha = async () => {
    setIsLoading(true);
    try {
      const autoRes = await autoSelectAlpha(selectedDataset, 'variance_separation');
      setAlpha(autoRes.selected_alpha);
      setAutoAlphaMeta(autoRes);
      setAlphaMode('auto');
      await executeDetection({ alpha_mode: 'auto', alpha: autoRes.selected_alpha });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        selectedDataset,
        setSelectedDataset,
        datasetMeta,
        setDatasetMeta,
        selectedFeature,
        setSelectedFeature,
        activeModel,
        setActiveModel,
        alphaMode,
        setAlphaMode,
        alpha,
        setAlpha,
        autoAlphaMeta,
        correlationWeight,
        setCorrelationWeight,
        timeRange,
        setTimeRange,
        isLoading,
        error,
        results,
        setResults,
        selectedPointIndex,
        setSelectedPointIndex,
        executeDetection,
        updateAlphaManually,
        triggerAutoAlpha,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}
