import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Sliders,
  Sparkles,
  Layers,
  Database,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Info,
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import ScoreCards from '../components/ScoreCards';
import AnomalyExplanationPanel from '../components/AnomalyExplanationPanel';
import ExportModal from '../components/ExportModal';

export default function AnomalyDetectionPage() {
  const {
    selectedDataset,
    datasetMeta,
    selectedFeature,
    setSelectedFeature,
    activeModel,
    setActiveModel,
    alphaMode,
    setAlphaMode,
    alpha,
    updateAlphaManually,
    triggerAutoAlpha,
    correlationWeight,
    setCorrelationWeight,
    isLoading,
    error,
    results,
    executeDetection,
  } = useAnalysis();

  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleRun = () => {
    executeDetection();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header & Run Control Bar */}
      <div className="card-theme rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-plum-900/10 dark:border-coral-300/15">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-xs uppercase tracking-wider text-berry-700 dark:text-coral-300 font-bold">
                Dataset: {selectedDataset === 'swan' ? 'SWAN-SF Solar Magnetogram' : selectedDataset}
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-plum-900 dark:text-cream-200">
              Interactive Anomaly Detection Dashboard
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {results && (
              <button
                onClick={() => setIsExportOpen(true)}
                id="export-results-btn"
                className="px-4 py-2.5 rounded-xl border border-berry-600/30 text-berry-800 dark:text-coral-200 bg-white/50 dark:bg-plum-900/40 hover:bg-berry-600/10 transition-colors text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results</span>
              </button>
            )}

            <button
              onClick={handleRun}
              disabled={isLoading}
              id="run-detection-btn"
              className="px-6 py-2.5 rounded-xl btn-primary font-heading font-semibold text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'Executing LFTSAD...' : 'Run Anomaly Detection'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Model Selection */}
          <div>
            <label className="font-heading font-semibold text-plum-900 dark:text-cream-200 block mb-1.5">
              Anomaly Detection Model:
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              id="model-select"
              className="w-full px-3 py-2 rounded-xl border border-plum-900/15 dark:border-coral-300/20 bg-cream-50 dark:bg-plum-900/60 text-plum-900 dark:text-cream-100 font-medium focus:outline-hidden"
            >
              <option value="baseline">1. Original LFTSAD Baseline</option>
              <option value="auto_alpha">2. LFTSAD + Automatic Alpha</option>
              <option value="correlation">3. LFTSAD + Cross-Variable Correlation</option>
              <option value="combined">4. Combined Improved Model</option>
            </select>
          </div>

          {/* Target Variable Selection */}
          <div>
            <label className="font-heading font-semibold text-plum-900 dark:text-cream-200 block mb-1.5">
              Target Signal Variable:
            </label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              id="feature-select"
              className="w-full px-3 py-2 rounded-xl border border-plum-900/15 dark:border-coral-300/20 bg-cream-50 dark:bg-plum-900/60 text-plum-900 dark:text-cream-100 font-mono font-medium focus:outline-hidden"
            >
              {datasetMeta?.feature_names?.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              )) || <option value="USFLUX">USFLUX (Total Unsigned Flux)</option>}
            </select>
          </div>

          {/* Alpha Mode Switcher */}
          <div>
            <label className="font-heading font-semibold text-plum-900 dark:text-cream-200 block mb-1.5">
              Alpha (α) Selection Mode:
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-cream-100 dark:bg-plum-900/60 border border-plum-900/10 dark:border-coral-300/20">
              <button
                type="button"
                onClick={() => setAlphaMode('manual')}
                className={`py-1 px-2 rounded-lg font-medium text-center transition-all ${
                  alphaMode === 'manual'
                    ? 'bg-[#BD5579] text-white shadow-xs font-bold'
                    : 'text-plum-800 dark:text-cream-200'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={triggerAutoAlpha}
                className={`py-1 px-2 rounded-lg font-medium text-center transition-all ${
                  alphaMode === 'auto'
                    ? 'bg-[#BD5579] text-white shadow-xs font-bold'
                    : 'text-plum-800 dark:text-cream-200'
                }`}
              >
                Auto (Opt)
              </button>
            </div>
          </div>

          {/* Real-time Alpha Slider (Manual Mode) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-heading font-semibold text-plum-900 dark:text-cream-200">
                Alpha Weight (α):
              </label>
              <span className="font-mono font-bold text-berry-700 dark:text-coral-300">
                {Number(alpha).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => updateAlphaManually(e.target.value)}
              id="alpha-slider"
              className="w-full accent-berry-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-plum-600 dark:text-coral-300/70 font-mono mt-0.5">
              <span>0.0 (Seq only)</span>
              <span>1.0 (Point only)</span>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Time-Series Graph */}
      <section className="space-y-2">
        <TimeSeriesChart />
      </section>

      {/* 4 Score Cards DIRECTLY BELOW the Graph in Exact Order */}
      <section className="space-y-2" id="score-cards-section">
        <ScoreCards />
      </section>

      {/* Anomaly Details Panel */}
      <section className="space-y-2">
        <AnomalyExplanationPanel />
      </section>

      {/* Ground-Truth Validation Panel (When known_anomaly is available) */}
      {results?.has_ground_truth && results?.ground_truth_evaluation && (
        <section className="card-theme rounded-2xl p-6 shadow-sm space-y-4 border-2 border-emerald-600/30">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-plum-900/10 dark:border-coral-300/15">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-plum-900 dark:text-cream-200">
                  Model Validation Against Ground-Truth ({results.ground_truth_column || 'known_anomaly'})
                </h3>
                <p className="text-xs text-berry-700 dark:text-coral-300">
                  Labels were reserved strictly for statistical evaluation and never used to generate predictions.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
              F1-Score: {results.ground_truth_evaluation.f1_score.toFixed(4)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Precision</span>
              <div className="font-mono text-lg font-bold text-plum-900 dark:text-cream-100 mt-0.5">
                {(results.ground_truth_evaluation.precision * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Recall</span>
              <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(results.ground_truth_evaluation.recall * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">F1-Score</span>
              <div className="font-mono text-lg font-bold text-berry-700 dark:text-coral-300 mt-0.5">
                {results.ground_truth_evaluation.f1_score.toFixed(4)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Specificity</span>
              <div className="font-mono text-lg font-bold text-plum-900 dark:text-cream-100 mt-0.5">
                {(results.ground_truth_evaluation.specificity * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">False Alarm Rate</span>
              <div className="font-mono text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
                {(results.ground_truth_evaluation.false_alarm_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">True Skill (TSS)</span>
              <div className="font-mono text-lg font-bold text-plum-900 dark:text-cream-100 mt-0.5">
                {results.ground_truth_evaluation.tss.toFixed(4)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cream-100/70 dark:bg-plum-900/50 border border-plum-900/10 dark:border-coral-300/10 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
            <div>
              <span className="font-semibold text-plum-900 dark:text-cream-200">Confusion Matrix:</span>
              <span className="ml-2">
                TP: <strong className="text-emerald-600">{results.ground_truth_evaluation.confusion_matrix.tp}</strong> |
                FP: <strong className="text-red-600">{results.ground_truth_evaluation.confusion_matrix.fp}</strong> |
                FN: <strong className="text-amber-600">{results.ground_truth_evaluation.confusion_matrix.fn}</strong> |
                TN: <strong className="text-plum-800 dark:text-cream-200">{results.ground_truth_evaluation.confusion_matrix.tn}</strong>
              </span>
            </div>
            <div className="text-[11px] text-plum-700 dark:text-coral-300">
              Total Observations Evaluated: {results.ground_truth_evaluation.total_samples}
            </div>
          </div>
        </section>
      )}

      {/* Anomaly Results Table (Requirement 5) */}
      {results && results.detected_anomaly_indices && (
        <section className="card-theme rounded-2xl p-6 shadow-sm space-y-4" id="anomaly-results-table-section">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-plum-900/10 dark:border-coral-300/15">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-berry-600 dark:text-coral-300" />
                <h3 className="font-heading font-bold text-base text-plum-900 dark:text-cream-200">
                  Detected Anomaly Results Table
                </h3>
              </div>
              <p className="text-xs text-plum-700/80 dark:text-coral-200/80 mt-0.5">
                Showing all {results.total_anomalies} flagged timestamps. Click any row to inspect its exact scores on the graph and score cards.
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 font-bold">
              {results.total_anomalies} Anomalies Detected
            </span>
          </div>

          {results.total_anomalies === 0 ? (
            <div className="p-8 text-center text-xs text-plum-700 dark:text-coral-200">
              No anomaly exceeded the anomaly threshold ({results.threshold.toFixed(6)}). All observations are within nominal bounds.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 rounded-xl border border-plum-900/10 dark:border-coral-300/15">
              <table className="w-full text-xs text-left font-mono border-collapse">
                <thead className="sticky top-0 bg-cream-200/90 dark:bg-plum-900/90 backdrop-blur-xs text-plum-900 dark:text-cream-100 z-10">
                  <tr className="border-b border-plum-900/15 dark:border-coral-300/20 font-bold">
                    <th className="py-2.5 px-3">Index</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Value ({selectedFeature})</th>
                    <th className="py-2.5 px-3">Point Score</th>
                    <th className="py-2.5 px-3">Sequence Score</th>
                    <th className="py-2.5 px-3">Combined Score</th>
                    {results.has_ground_truth && <th className="py-2.5 px-3">Known Anomaly</th>}
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5 dark:divide-coral-300/10 text-plum-900 dark:text-cream-200">
                  {results.detected_anomaly_indices.map((idx) => {
                    const isSelected = idx === results.selectedPointIndex;
                    const val = results.feature_values ? results.feature_values[idx] : null;
                    const pt = results.point_scores ? results.point_scores[idx] : null;
                    const seq = results.sequence_scores ? results.sequence_scores[idx] : null;
                    const comb = results.combined_scores ? results.combined_scores[idx] : null;
                    const ts = results.timestamps ? results.timestamps[idx] : `t_${idx}`;
                    const gt = results.has_ground_truth && results.ground_truth_labels ? results.ground_truth_labels[idx] : null;

                    return (
                      <tr
                        key={`anomaly-row-${idx}`}
                        onClick={() => setSelectedFeature && results.selectedPointIndex !== undefined}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-berry-600/15 dark:bg-plum-800/60 font-bold'
                            : 'hover:bg-cream-100/50 dark:hover:bg-plum-900/40'
                        }`}
                      >
                        <td className="py-2 px-3 text-berry-700 dark:text-coral-300 font-bold">#{idx}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{ts}</td>
                        <td className="py-2 px-3">{val !== null ? val.toFixed(4) : 'N/A'}</td>
                        <td className="py-2 px-3">{pt !== null ? pt.toFixed(6) : 'N/A'}</td>
                        <td className="py-2 px-3">{seq !== null ? seq.toFixed(6) : 'N/A'}</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400 font-bold">
                          {comb !== null ? comb.toFixed(6) : 'N/A'}
                        </td>
                        {results.has_ground_truth && (
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                gt === 1
                                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {gt === 1 ? 'True Anomaly' : 'Normal Flagged'}
                            </span>
                          </td>
                        )}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-md bg-berry-600 text-white text-[10px] font-semibold hover:bg-berry-700 transition-colors"
                          >
                            Inspect Point
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}
