import React from 'react';
import {
  BookOpen,
  FileText,
  Layers,
  Target,
  Sliders,
  Share2,
  Database,
  ShieldAlert,
  ExternalLink,
  Code2,
} from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Title */}
      <div className="space-y-2 pb-4 border-b border-plum-900/10 dark:border-coral-300/15">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-berry-600/15 text-berry-700 dark:text-coral-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific Documentation & Experimental Protocol</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-plum-900 dark:text-cream-200">
          Research Methodology & Formal Specifications
        </h2>
        <p className="text-xs sm:text-sm text-plum-700/80 dark:text-coral-200/80 leading-relaxed">
          Full technical disclosure of the Lightweight and Fast Time-Series Anomaly Detection (LFTSAD) baseline, our mathematical extensions, data provenance, and empirical experimental protocols.
        </p>
      </div>

      {/* 1. Research Motivation & Problem Formulation */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          1. Research Motivation &amp; Theoretical Background
        </h3>
        <div className="text-xs text-plum-800 dark:text-cream-200 space-y-3 leading-relaxed">
          <p>
            Unsupervised time-series anomaly detection in high-stakes domains—such as solar flare forecasting, satellite telemetry, and industrial power grids—requires models that are both <strong>computationally lightweight</strong> and capable of capturing anomalies occurring across multiple temporal granularities.
          </p>
          <p>
            Standard reconstruction models (Autoencoders, RNNs, and Transformers) either focus exclusively on point-wise residual magnitudes (ignoring temporal shape) or suffer from high computational complexity <span className="font-mono">O(L²)</span> that hinders real-time streaming operations.
          </p>
          <p>
            The <strong>LFTSAD</strong> paradigm addresses this by employing a dual-reconstruction architecture that decomposes time windows into both point-level and sequence-level patch representations using efficient Multi-Layer Perceptrons (MLPs), achieving linear inference speed <span className="font-mono">O(L)</span>.
          </p>
        </div>
      </section>

      {/* 2. Original LFTSAD Architecture */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-5">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          2. Original LFTSAD Architecture &amp; Mechanics
        </h3>

        <div className="space-y-4 text-xs text-plum-800 dark:text-cream-200 leading-relaxed">
          <p>
            Given an input multivariate sequence <span className="font-mono">X ∈ ℝ^(B × L × M)</span> with batch size <span className="font-mono">B</span>, window length <span className="font-mono">L</span>, and <span className="font-mono">M</span> physical channels:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2">
              <div className="font-heading font-bold text-xs text-berry-700 dark:text-coral-300 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Reversible Instance Normalization (RevIN)
              </div>
              <p>
                Eliminates non-stationary distribution shifts by subtracting the local window mean and dividing by the standard deviation before MLP encoding, and re-scaling upon output.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/15 space-y-2">
              <div className="font-heading font-bold text-xs text-berry-700 dark:text-coral-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Dual Multi-Scale Patch MLPs
              </div>
              <p>
                Decomposes window into non-overlapping patches of sizes <span className="font-mono">patch_size ∈ [3, 5, 7]</span> and sequence patches <span className="font-mono">patch_seq ∈ [6]</span> to learn prior vs. series reconstructions.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cream-100 dark:bg-plum-900/70 border border-plum-900/10 dark:border-coral-300/20 font-mono text-[11px] space-y-2">
            <div className="font-bold text-plum-900 dark:text-cream-100">Core Anomaly Score Fusion Equation:</div>
            <div className="text-berry-700 dark:text-coral-300">
              CombinedScore(t) = α · PointScore(t) + (1 - α) · SequenceScore(t)
            </div>
            <div className="text-[10px] text-plum-700 dark:text-cream-300/70 pt-1">
              where PointScore(t) measures instant reconstruction residual and SequenceScore(t) measures surrounding context divergence.
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proposed Research Improvements */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-5">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          3. Proposed Research Improvements (SignalSense Innovations)
        </h3>

        <div className="space-y-4 text-xs text-plum-800 dark:text-cream-200 leading-relaxed">
          <div>
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-berry-600 dark:text-coral-300" />
              A. Unsupervised Automatic Alpha Selection
            </h4>
            <p className="mt-1">
              Rather than assuming an ad-hoc <span className="font-mono">α = 0.5</span>, SignalSense evaluates the variance-to-tail entropy ratio on an unlabelled calibration set. This automatically tunes the hyperparameter to reflect the dominant anomaly type of the physical system (e.g. abrupt magnetic field reconnections vs gradual shear accumulations).
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm text-plum-900 dark:text-cream-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-berry-600 dark:text-coral-300" />
              B. Cross-Variable Correlation Enhancement
            </h4>
            <p className="mt-1">
              We construct a normalized empirical inter-variable correlation matrix <span className="font-mono">R ∈ ℝ^(24×24)</span> from normal training streams. During inference, if a single channel deviates while its physically correlated partners remain quiescent, the anomaly score is discounted; if coupled channels deviate in tandem, the anomaly score is amplified.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Dataset Description: SWAN-SF */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          4. SWAN-SF Benchmark Dataset Specification
        </h3>
        <div className="text-xs text-plum-800 dark:text-cream-200 space-y-3 leading-relaxed">
          <p>
            The <strong>Space Weather ANalytics for Solar Flares (SWAN-SF)</strong> dataset is a benchmark curated from the Solar Dynamics Observatory (SDO) Helioseismic and Magnetic Imager (HMI).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <tbody className="divide-y divide-plum-900/10 dark:divide-coral-300/15">
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-plum-900 dark:text-cream-100">Temporal Cadence</td>
                  <td className="py-2 px-3 text-berry-700 dark:text-coral-300">12 minutes per observation</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-plum-900 dark:text-cream-100">Window Length</td>
                  <td className="py-2 px-3 text-berry-700 dark:text-coral-300">60 timesteps (12 continuous physical hours)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-plum-900 dark:text-cream-100">Feature Count</td>
                  <td className="py-2 px-3 text-berry-700 dark:text-coral-300">24 photospheric magnetic parameters (USFLUX, TOTUSJH, TOTPOT, etc.)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-plum-900 dark:text-cream-100">Evaluation Partitions</td>
                  <td className="py-2 px-3 text-berry-700 dark:text-coral-300">Train: 80 regions | Val: 30 regions | Test: 40 regions (14 Flares / 26 Quiet)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-semibold text-plum-900 dark:text-cream-100">Ground-Truth Classes</td>
                  <td className="py-2 px-3 text-berry-700 dark:text-coral-300">Normal (Quiet Sun 'Q') vs Anomaly (M and X Class Solar Eruptions)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Scientific Limitations & Disclosures */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          5. Known Limitations &amp; Ethical Disclosures
        </h3>
        <div className="text-xs text-plum-800 dark:text-cream-200 space-y-2 leading-relaxed">
          <p>
            <strong>Statistical vs Causal Significance:</strong> High anomaly scores signify unexpected divergence from learned multi-scale regularities. They do not demonstrate direct physical causation without domain-expert validation.
          </p>
          <p>
            <strong>Stationarity Assumptions:</strong> RevIN mitigates gradual sensor drift, but abrupt sensor recalibration or hardware replacement can trigger temporary spurious discrepancies until window statistics settle.
          </p>
          <p>
            <strong>Inference vs Lifelong Training:</strong> In the current implementation, models are pre-trained on historical normal regimes and run inference in chunks. Incremental on-satellite weight updating remains open research.
          </p>
        </div>
      </section>

      {/* 6. Academic References */}
      <section className="card-theme rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-lg text-plum-900 dark:text-cream-200 flex items-center gap-2">
          <span className="w-2 h-5 bg-berry-600 rounded-sm"></span>
          6. Academic References
        </h3>
        <ul className="text-xs text-plum-800 dark:text-cream-200 space-y-2.5 font-mono">
          <li className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/30 border border-plum-900/10 dark:border-coral-300/10">
            [1] <em>&ldquo;Lightweight and Fast Time-Series Anomaly Detection via Point-Level and Sequence-Level Reconstruction Discrepancy&rdquo;</em> (LFTSAD), Research Baseline Architecture.
          </li>
          <li className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/30 border border-plum-900/10 dark:border-coral-300/10">
            [2] Angerhausen, D. et al., <em>&ldquo;SWAN-SF: Space Weather ANalytics for Solar Flares Benchmark Dataset,&rdquo;</em> Scientific Data, Nature Publishing Group.
          </li>
          <li className="p-3 rounded-xl bg-cream-50 dark:bg-plum-900/30 border border-plum-900/10 dark:border-coral-300/10">
            [3] Kim, T. et al., <em>&ldquo;Reversible Instance Normalization for Accurate Time-Series Forecasting against Distribution Shift&rdquo;</em> (RevIN), ICLR.
          </li>
        </ul>
      </section>
    </div>
  );
}
