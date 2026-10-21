import React, { useState } from 'react';
import { Download, FileText, Check, X, ShieldAlert } from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function ExportModal({ isOpen, onClose }) {
  const { results, selectedDataset, selectedFeature, activeModel, alpha } = useAnalysis();
  const [format, setFormat] = useState('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (!results || !results.timestamps) return;
    setIsExporting(true);

    try {
      const rows = [];
      // CSV Header
      rows.push([
        'index',
        'timestamp',
        'feature_name',
        'measured_value',
        'point_level_score',
        'sequence_level_score',
        'combined_score',
        'anomaly_prediction',
        'threshold',
        'alpha',
        'model_name',
      ].join(','));

      const total = results.timestamps.length;
      for (let i = 0; i < total; i++) {
        rows.push([
          i,
          `"${results.timestamps[i] || `t_${i}`}"`,
          results.selected_feature || selectedFeature,
          results.feature_values ? results.feature_values[i] : '',
          results.point_scores ? results.point_scores[i] : '',
          results.sequence_scores ? results.sequence_scores[i] : '',
          results.combined_scores ? results.combined_scores[i] : '',
          results.predictions ? results.predictions[i] : 0,
          results.threshold !== undefined ? results.threshold : '',
          alpha,
          activeModel,
        ].join(','));
      }

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `signalsense_${selectedDataset}_${activeModel}_results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-xs">
      <div className="card-theme max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-berry-700/30">
        <div className="flex items-center justify-between pb-3 border-b border-plum-900/10 dark:border-coral-300/15">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-berry-600/15 text-berry-600 dark:text-coral-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-plum-900 dark:text-cream-200">
                Export Analysis Results
              </h3>
              <p className="text-xs text-berry-700 dark:text-coral-300">
                Download verified model predictions and scores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-plum-700 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-plum-900/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-plum-800 dark:text-cream-200">
          <div className="p-3 rounded-xl bg-cream-100 dark:bg-plum-900/50 border border-plum-900/10 dark:border-coral-300/10 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Dataset:</span>
              <span className="font-bold text-plum-900 dark:text-cream-100">{selectedDataset}</span>
            </div>
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-bold text-berry-700 dark:text-coral-300">{activeModel}</span>
            </div>
            <div className="flex justify-between">
              <span>Observations:</span>
              <span className="font-bold text-plum-900 dark:text-cream-100">{results?.timestamps?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Detected Anomalies:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{results?.total_anomalies || 0}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-heading font-semibold text-xs text-plum-900 dark:text-cream-200 block">
              Format:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-2 px-3 rounded-xl font-medium border text-center transition-all ${
                  format === 'csv'
                    ? 'border-berry-600 bg-berry-600/15 text-berry-800 dark:text-coral-200 font-bold'
                    : 'border-plum-900/10 dark:border-coral-300/15 text-plum-700 dark:text-cream-300'
                }`}
              >
                CSV Table (.csv)
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`py-2 px-3 rounded-xl font-medium border text-center transition-all ${
                  format === 'json'
                    ? 'border-berry-600 bg-berry-600/15 text-berry-800 dark:text-coral-200 font-bold'
                    : 'border-plum-900/10 dark:border-coral-300/15 text-plum-700 dark:text-cream-300'
                }`}
              >
                Structured JSON (.json)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-plum-900/10 dark:border-coral-300/15">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-plum-800 dark:text-cream-300 hover:bg-cream-200 dark:hover:bg-plum-900/50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 rounded-xl btn-primary text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
