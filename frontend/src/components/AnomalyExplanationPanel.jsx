import React, { useMemo } from 'react';
import {
  HelpCircle,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function AnomalyExplanationPanel() {
  const { results, selectedPointIndex, setSelectedPointIndex, selectedFeature, alpha } = useAnalysis();

  // Safe formatting helper: never invent values, output 'Not available' for missing data
  const fmt = (val, digits = 4) => {
    if (val === null || val === undefined || isNaN(val)) return 'Not available';
    return Number(val).toFixed(digits);
  };

  // Extract nearby observations context (window of t-3 to t+3)
  const nearbyContext = useMemo(() => {
    if (!results?.feature_values || selectedPointIndex === null || selectedPointIndex === undefined) return null;
    const total = results.feature_values.length;
    const idx = selectedPointIndex;
    const radius = 3;
    const start = Math.max(0, idx - radius);
    const end = Math.min(total, idx + radius + 1);

    const points = [];
    for (let i = start; i < end; i++) {
      points.push({
        index: i,
        timestamp: results.timestamps && results.timestamps[i] !== undefined ? String(results.timestamps[i]) : `t_${i}`,
        value: results.feature_values[i],
        isCurrent: i === idx,
        isAnomaly: results.predictions ? results.predictions[i] === 1 : false,
        combinedScore: results.combined_scores ? results.combined_scores[i] : null,
      });
    }

    const neighbors = points.filter(p => !p.isCurrent);
    const mean = neighbors.length > 0
      ? neighbors.reduce((acc, p) => acc + (p.value || 0), 0) / neighbors.length
      : null;

    return { points, mean };
  }, [results, selectedPointIndex]);

  // If no observation is currently selected or no results exist
  if (!results || selectedPointIndex === null || selectedPointIndex === undefined) {
    return (
      <div className="card-theme rounded-2xl p-6 text-center text-plum-800 dark:text-cream-200 shadow-sm" id="anomaly-explanation-panel">
        <HelpCircle className="w-8 h-8 mx-auto text-berry-600 dark:text-coral-300 mb-2" />
        <h4 className="font-heading font-semibold text-sm">Select an Observation</h4>
        <p className="text-xs text-plum-700/80 dark:text-cream-300/70 mt-1 max-w-md mx-auto">
          Click any observation point or red anomaly marker on the time-series chart above to inspect its point-level, sequence-level, and combined model evidence.
        </p>
      </div>
    );
  }

  const idx = selectedPointIndex;
  const isAnomaly = results.predictions && results.predictions[idx] !== undefined
    ? results.predictions[idx] === 1
    : null;

  const observedVal = results.feature_values && results.feature_values[idx] !== undefined && results.feature_values[idx] !== null
    ? results.feature_values[idx]
    : null;

  const ptScore = results.point_scores && results.point_scores[idx] !== undefined && results.point_scores[idx] !== null
    ? results.point_scores[idx]
    : null;

  const seqScore = results.sequence_scores && results.sequence_scores[idx] !== undefined && results.sequence_scores[idx] !== null
    ? results.sequence_scores[idx]
    : null;

  const combScore = results.combined_scores && results.combined_scores[idx] !== undefined && results.combined_scores[idx] !== null
    ? results.combined_scores[idx]
    : null;

  const threshold = results.threshold !== undefined && results.threshold !== null
    ? results.threshold
    : null;

  const effectiveAlpha = results.alpha !== undefined && results.alpha !== null
    ? Number(results.alpha)
    : (alpha !== undefined && alpha !== null ? Number(alpha) : null);

  const timestamp = results.timestamps && results.timestamps[idx] !== undefined
    ? String(results.timestamps[idx])
    : 'Not available';

  // Evidence synthesis using actual formula: CombinedScore = alpha * PointScore + (1 - alpha) * SequenceScore
  let evidenceExplanation = '';
  let discrepancyDominance = '';

  const weightedPoint = effectiveAlpha !== null && ptScore !== null ? effectiveAlpha * ptScore : null;
  const weightedSeq = effectiveAlpha !== null && seqScore !== null ? (1.0 - effectiveAlpha) * seqScore : null;
  const thresholdMargin = combScore !== null && threshold !== null ? combScore - threshold : null;

  if (combScore !== null && threshold !== null && isAnomaly !== null) {
    if (isAnomaly) {
      const margin = combScore - threshold;
      evidenceExplanation = `The combined discrepancy is above the detection threshold by ${fmt(margin, 6)}.`;
    } else {
      const margin = threshold - combScore;
      evidenceExplanation = `The combined score does not exceed the detection threshold (${fmt(combScore, 6)} ≤ ${fmt(threshold, 6)}), remaining within normal bounds by ${fmt(margin, 6)}.`;
    }
  } else if (combScore !== null) {
    evidenceExplanation = `Combined discrepancy score evaluated to ${fmt(combScore, 6)}. Detection threshold is Not available.`;
  } else {
    evidenceExplanation = 'Discrepancy scores are Not available for this observation.';
  }

  if (weightedPoint !== null && weightedSeq !== null) {
    if (weightedSeq > weightedPoint) {
      discrepancyDominance = `The sequence-level contribution is larger than the point-level contribution (${fmt(weightedSeq, 6)} vs ${fmt(weightedPoint, 6)}), suggesting that the sequence discrepancy contributes more to this score.`;
    } else if (weightedPoint > weightedSeq) {
      discrepancyDominance = `The point-level contribution is larger than the sequence-level contribution (${fmt(weightedPoint, 6)} vs ${fmt(weightedSeq, 6)}), suggesting that the individual point discrepancy contributes more to this score.`;
    } else {
      discrepancyDominance = `The point-level contribution (${fmt(weightedPoint, 6)}) and sequence-level contribution (${fmt(weightedSeq, 6)}) are equal, contributing evenly to the combined score.`;
    }
  }

  return (
    <div className="card-theme rounded-2xl p-5 sm:p-6 shadow-sm space-y-5" id="anomaly-details-panel">
      {/* Header with observation details and status badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-plum-900/10 dark:border-coral-300/15">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAnomaly === true
                ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                : isAnomaly === false
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-plum-500/15 text-plum-700 dark:text-coral-300'
            }`}
          >
            {isAnomaly === true ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-plum-900 dark:text-cream-200">
              Observation #{idx} Evidence Analysis
            </h3>
            <p className="text-xs font-mono text-berry-700 dark:text-coral-300">
              Timestep: {timestamp} &bull; Variable: {selectedFeature || 'Not available'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide ${
              isAnomaly === true
                ? 'bg-red-600 text-white shadow-xs'
                : isAnomaly === false
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-plum-700 text-white shadow-xs'
            }`}
          >
            {isAnomaly === true
              ? 'FLAGGED ANOMALY'
              : isAnomaly === false
              ? 'NORMAL OBSERVATION'
              : 'STATUS UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Concise Evidence-Based Explanation Box */}
      <div className="p-4 rounded-xl bg-cream-50/80 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-heading font-bold uppercase tracking-wider text-berry-800 dark:text-coral-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Model Evidence Explanation</span>
        </div>
        <p className="text-xs sm:text-sm text-plum-900 dark:text-cream-100 leading-relaxed font-medium">
          {evidenceExplanation}
        </p>
        {discrepancyDominance && (
          <p className="text-xs text-plum-800/90 dark:text-cream-200/90 leading-relaxed pt-1 border-t border-plum-900/10 dark:border-coral-300/10">
            {discrepancyDominance}
          </p>
        )}
        <p className="text-[11px] text-plum-700/80 dark:text-coral-200/80 pt-1 border-t border-plum-900/10 dark:border-coral-300/10 leading-relaxed">
          The point-level score measures individual reconstruction discrepancy ||x(t) &minus; x̂(t)||² and the sequence-level score measures sequence/context reconstruction discrepancy ||S(t) &minus; Ŝ(t)||², consistent with the LFTSAD model architecture.
        </p>
        {nearbyContext?.mean !== null && observedVal !== null && (
          <p className="text-[11px] text-plum-700/80 dark:text-coral-200/80 italic">
            Observed reading of {fmt(observedVal, 4)} compares to local surrounding mean of {fmt(nearbyContext.mean, 4)} (difference from local mean: {fmt(observedVal - nearbyContext.mean, 4)}).
          </p>
        )}
      </div>

      {/* Observation Evidence Summary Metrics */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-plum-900 dark:text-cream-200 border-collapse">
          <thead>
            <tr className="border-b border-plum-900/10 dark:border-coral-300/20 text-berry-800 dark:text-coral-300 font-heading font-semibold">
              <th className="py-2.5 px-3">Metric</th>
              <th className="py-2.5 px-3">Actual Value</th>
              <th className="py-2.5 px-3">Threshold / Baseline</th>
              <th className="py-2.5 px-3">Discrepancy Formula & Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum-900/5 dark:divide-coral-300/10 font-mono">
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Classification</td>
              <td className="py-2 px-3 font-bold">
                {isAnomaly === true ? (
                  <span className="text-red-600 dark:text-red-400">Anomaly</span>
                ) : isAnomaly === false ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Normal</span>
                ) : (
                  'Not available'
                )}
              </td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">—</td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">Model classification via C(t) &gt; &tau;</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Observed Measurement</td>
              <td className="py-2 px-3 font-bold">{fmt(observedVal, 4)}</td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">
                {nearbyContext?.mean !== null ? `Local mean: ${fmt(nearbyContext.mean, 4)}` : '—'}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">Observed {selectedFeature} value at timestep {timestamp} (index #{idx})</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Point Score P(t)</td>
              <td className="py-2 px-3 font-bold">{fmt(ptScore, 6)}</td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">
                {weightedPoint !== null ? `&alpha;&middot;P: ${fmt(weightedPoint, 6)}` : '—'}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">Individual point reconstruction discrepancy ||x(t) &minus; x̂(t)||²</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Sequence Score S(t)</td>
              <td className="py-2 px-3 font-bold">{fmt(seqScore, 6)}</td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">
                {weightedSeq !== null ? `(1&minus;&alpha;)&middot;S: ${fmt(weightedSeq, 6)}` : '—'}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">Sequence/context pattern reconstruction discrepancy ||S(t) &minus; Ŝ(t)||²</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Alpha Weight (&alpha;)</td>
              <td className="py-2 px-3 font-bold">{fmt(effectiveAlpha, 2)}</td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">
                {effectiveAlpha !== null ? `${Math.round(effectiveAlpha * 100)}% Pt / ${Math.round((1 - effectiveAlpha) * 100)}% Seq` : '—'}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">Point contribution: {fmt(weightedPoint, 6)}, Seq contribution: {fmt(weightedSeq, 6)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Combined Score C(t)</td>
              <td className={`py-2 px-3 font-bold ${isAnomaly === true ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-300'}`}>
                {fmt(combScore, 6)}
              </td>
              <td className="py-2 px-3 font-bold text-plum-900 dark:text-cream-100">
                {fmt(threshold, 6)}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">
                C(t) = &alpha;&middot;P(t) + (1&minus;&alpha;)&middot;S(t)
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-sans font-medium text-plum-800 dark:text-cream-300">Detection Threshold (&tau;)</td>
              <td className="py-2 px-3 font-bold">{fmt(threshold, 6)}</td>
              <td className="py-2 px-3 text-plum-600 dark:text-cream-300/70">
                {thresholdMargin !== null ? (thresholdMargin > 0 ? `Margin: +${fmt(thresholdMargin, 6)}` : `Margin: ${fmt(thresholdMargin, 6)}`) : '—'}
              </td>
              <td className="py-2 px-3 font-sans text-plum-700 dark:text-cream-300/80">
                {thresholdMargin !== null ? (thresholdMargin > 0 ? 'Above threshold by margin' : 'Below threshold by margin') : 'Threshold evaluation'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nearby Observations Context Strip */}
      {nearbyContext && nearbyContext.points.length > 0 && (
        <div className="pt-2 border-t border-plum-900/10 dark:border-coral-300/10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-heading font-semibold text-plum-900 dark:text-cream-200">
              Nearby Observations Window (t-3 to t+3):
            </span>
            <span className="font-mono text-[11px] text-berry-700 dark:text-coral-300">
              Surrounding Mean: {fmt(nearbyContext.mean, 4)}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {nearbyContext.points.map((p) => {
              const isSelected = p.isCurrent;
              return (
                <button
                  key={`nearby-point-${p.index}`}
                  type="button"
                  onClick={() => setSelectedPointIndex(p.index)}
                  className={`p-2 rounded-xl text-left font-mono transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-berry-600 text-white border-berry-600 shadow-xs ring-2 ring-berry-600/30'
                      : 'bg-cream-50 dark:bg-plum-900/40 text-plum-900 dark:text-cream-200 border-plum-900/10 dark:border-coral-300/15 hover:border-berry-600/40'
                  }`}
                  title={`Observation #${p.index}: ${fmt(p.value, 4)} (${p.isAnomaly ? 'Anomaly' : 'Normal'})`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className={isSelected ? 'text-cream-100 font-bold' : 'text-berry-700 dark:text-coral-300'}>
                      #{p.index}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isAnomaly ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : ''}`}>
                    {fmt(p.value, 2)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
