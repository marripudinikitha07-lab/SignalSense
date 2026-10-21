import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Database,
  Upload,
  ArrowRight,
  Sparkles,
  GitCompare,
  Sliders,
  Layers,
  Target,
  ShieldAlert,
  Cpu,
  BarChart2,
  FileCheck2,
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { setSelectedDataset } = useAnalysis();

  const handleExploreSwan = () => {
    setSelectedDataset('swan');
    navigate('/dataset');
  };

  const handleUploadData = () => {
    navigate('/dataset?tab=upload');
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#601D49] via-[#4e143b] to-[#200718] text-[#FFEBB8] p-8 sm:p-12 shadow-2xl border border-berry-700/40">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#BD5579]/25 border border-[#EA9D9D]/30 text-[#EA9D9D] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#FFEBB8]" />
            <span>Research-Grade Time-Series Anomaly Detection</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find unusual patterns. <br />
            <span className="text-[#FFEBB8]">Understand them easily.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#FFEBB8]/85 font-normal leading-relaxed max-w-2xl">
            SignalSense advances the <strong>LFTSAD</strong> (Lightweight and Fast Time-Series Anomaly Detection) architecture, uncovering anomalies across multi-variate continuous physical streams using dual-scale point-level and sequence-level reconstruction discrepancies.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleExploreSwan}
              id="hero-explore-swan-btn"
              className="px-6 py-3.5 rounded-xl btn-primary font-heading font-semibold text-sm inline-flex items-center space-x-2.5 shadow-lg cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#FFEBB8]" />
              <span>Explore SWAN Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleUploadData}
              id="hero-upload-data-btn"
              className="px-6 py-3.5 rounded-xl bg-[#200718]/80 hover:bg-[#380d2a] text-[#FFEBB8] border border-[#EA9D9D]/30 font-heading font-semibold text-sm inline-flex items-center space-x-2.5 transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#EA9D9D]" />
              <span>Upload Your Data</span>
            </button>
          </div>
        </div>

        {/* Decorative background grid and soft glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#BD5579]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#EA9D9D]/15 blur-3xl pointer-events-none"></div>
      </section>

      {/* Visual Explanation of Dual-Scale Reconstruction Discrepancies */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <h2 className="font-heading text-2xl font-bold text-plum-900 dark:text-cream-200">
            How Dual-Scale Reconstruction Works
          </h2>
          <p className="text-xs sm:text-sm text-plum-700/80 dark:text-coral-200/80">
            LFTSAD decouples anomaly detection into two simultaneous views: immediate reading spikes and temporal pattern context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Point-Level Discrepancy Card */}
          <div className="card-theme p-6 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-plum-700/10 dark:bg-coral-300/10 text-plum-700 dark:text-coral-300 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-berry-700 dark:text-coral-300 uppercase tracking-wider">
                Perspective 1
              </span>
              <h3 className="font-heading text-base font-bold text-plum-900 dark:text-cream-200">
                Point-Level Discrepancy
              </h3>
            </div>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              <strong>&ldquo;How unusual is this individual reading?&rdquo;</strong> Isolates the exact measurement at timestamp <span className="font-mono">t</span> and assesses how poorly the neural network reconstructs its immediate magnitude compared to adjacent points.
            </p>
            <div className="pt-3 border-t border-plum-900/10 dark:border-coral-300/10 flex items-center justify-between text-[11px] font-mono text-plum-700 dark:text-coral-300">
              <span>Formula:</span>
              <span className="font-semibold">|| x(t) - x̂_point(t) ||²</span>
            </div>
          </div>

          {/* Sequence-Level Discrepancy Card */}
          <div className="card-theme p-6 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-berry-600/10 text-berry-600 dark:text-coral-300 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-berry-700 dark:text-coral-300 uppercase tracking-wider">
                Perspective 2
              </span>
              <h3 className="font-heading text-base font-bold text-plum-900 dark:text-cream-200">
                Sequence-Level Discrepancy
              </h3>
            </div>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              <strong>&ldquo;How unusual is this reading within its surrounding pattern?&rdquo;</strong> Evaluates patch-level contextual sequences over time window <span className="font-mono">W</span>, capturing subtle shape deformations or sudden rhythm disruptions.
            </p>
            <div className="pt-3 border-t border-plum-900/10 dark:border-coral-300/10 flex items-center justify-between text-[11px] font-mono text-plum-700 dark:text-coral-300">
              <span>Formula:</span>
              <span className="font-semibold">|| S(t) - Ŝ_seq(t) ||²</span>
            </div>
          </div>

          {/* Combined Fusion & Alpha Card */}
          <div className="card-theme p-6 rounded-2xl space-y-3 relative overflow-hidden bg-gradient-to-br from-white to-cream-100/50 dark:from-plum-900/30 dark:to-plum-950/40 border-2 border-berry-600/25">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BD5579] to-[#EA9D9D] text-[#200718] flex items-center justify-center shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-berry-700 dark:text-coral-300 uppercase tracking-wider">
                Score Synthesis
              </span>
              <h3 className="font-heading text-base font-bold text-plum-900 dark:text-cream-200">
                Weighted Fusion with Alpha (α)
              </h3>
            </div>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              <strong>Combined anomaly score:</strong> Blends both views into an overall discrepancy score using the parameter <span className="font-mono font-bold">α</span>, balancing sensitivity between transient point spikes and prolonged morphological anomalies.
            </p>
            <div className="pt-3 border-t border-plum-900/10 dark:border-coral-300/10 flex items-center justify-between text-[11px] font-mono text-berry-700 dark:text-coral-300 font-bold">
              <span>Combined(t) =</span>
              <span>α·Point(t) + (1-α)·Seq(t)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Summary of Research Improvements */}
      <section className="card-theme rounded-3xl p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-plum-900/10 dark:border-coral-300/15">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-berry-600 dark:text-coral-300" />
              <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-cream-200">
                Research Improvements Implemented in SignalSense
              </h2>
            </div>
            <p className="text-xs text-plum-700/80 dark:text-coral-200/80 mt-1">
              Empirically evaluated extensions addressing baseline limitations on the SWAN dataset.
            </p>
          </div>
          <button
            onClick={() => navigate('/improvements')}
            className="text-xs font-semibold text-berry-700 dark:text-coral-300 hover:text-plum-900 dark:hover:text-cream-100 inline-flex items-center space-x-1"
          >
            <span>Read full research documentation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2.5">
            <div className="font-mono text-xs font-bold text-berry-700 dark:text-coral-300 flex items-center justify-between">
              <span>Extension 1</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Verified
              </span>
            </div>
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Automatic Alpha Selection
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              Replaces heuristic manual alpha tuning with an unsupervised discrepancy variance separation strategy calibrated on validation intervals without test set data leakage.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2.5">
            <div className="font-mono text-xs font-bold text-berry-700 dark:text-coral-300 flex items-center justify-between">
              <span>Extension 2</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Verified
              </span>
            </div>
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Cross-Variable Correlation Enhancement
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              Leverages inter-channel Pearson covariance across 24 physical magnetic features to weight reconstruction discrepancies according to sensor co-movement violations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2.5">
            <div className="font-mono text-xs font-bold text-berry-700 dark:text-coral-300 flex items-center justify-between">
              <span>Extension 3</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Integrated
              </span>
            </div>
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Combined Improved Model
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80 leading-relaxed">
              Synthesizes optimized dual-scale alpha weighting with multi-variate correlation penalty scores, demonstrating measurable F1 improvements over the original baseline.
            </p>
          </div>
        </div>
      </section>

      {/* Available Analysis Features Grid */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-cream-200 text-center">
          Comprehensive Research Toolkit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/dataset')}
            className="card-theme p-5 rounded-2xl cursor-pointer hover:border-berry-600 space-y-2 transition-all"
          >
            <Database className="w-6 h-6 text-berry-600 dark:text-coral-300" />
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              SWAN Dataset & CSV
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80">
              Inspect solar magnetogram streams or validate your own time series.
            </p>
          </div>

          <div
            onClick={() => navigate('/detect')}
            className="card-theme p-5 rounded-2xl cursor-pointer hover:border-berry-600 space-y-2 transition-all"
          >
            <Activity className="w-6 h-6 text-berry-600 dark:text-coral-300" />
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Interactive Dashboard
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80">
              Inspect anomalies, real-time recalculation with 4 score cards.
            </p>
          </div>

          <div
            onClick={() => navigate('/comparison')}
            className="card-theme p-5 rounded-2xl cursor-pointer hover:border-berry-600 space-y-2 transition-all"
          >
            <GitCompare className="w-6 h-6 text-berry-600 dark:text-coral-300" />
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Model Comparison
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80">
              Empirical F1, precision, recall, and runtime benchmarks.
            </p>
          </div>

          <div
            onClick={() => navigate('/methodology')}
            className="card-theme p-5 rounded-2xl cursor-pointer hover:border-berry-600 space-y-2 transition-all"
          >
            <FileCheck2 className="w-6 h-6 text-berry-600 dark:text-coral-300" />
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-200">
              Academic Methodology
            </h4>
            <p className="text-xs text-plum-800/80 dark:text-cream-300/80">
              Equations, mathematical formulations, and research citations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
