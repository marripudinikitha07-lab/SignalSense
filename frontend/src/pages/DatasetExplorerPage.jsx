import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Download,
  Filter,
  Eye,
  Activity,
  Layers,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { fetchDatasetPreview, uploadCsvFile } from '../services/api';

export default function DatasetExplorerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'upload' ? 'upload' : 'swan';

  const {
    selectedDataset,
    setSelectedDataset,
    datasetMeta,
    selectedFeature,
    setSelectedFeature,
    timeRange,
    setTimeRange,
    executeDetection,
  } = useAnalysis();

  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const handleTabChange = (newTab) => {
    if (newTab === 'upload') {
      setSearchParams({ tab: 'upload' });
    } else {
      setSearchParams({});
      setSelectedDataset('swan');
    }
  };

  // Load preview data when selectedDataset changes
  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const preview = await fetchDatasetPreview(selectedDataset, 50);
      setPreviewData(preview);
    } catch (err) {
      console.warn('Could not fetch preview from backend:', err);
      setPreviewError(err.message || 'Could not connect to backend to load preview data.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchPreview() {
      setIsLoadingPreview(true);
      setPreviewError(null);
      try {
        const preview = await fetchDatasetPreview(selectedDataset, 50);
        if (isMounted) setPreviewData(preview);
      } catch (err) {
        console.warn('Could not fetch preview from backend:', err);
        if (isMounted) setPreviewError(err.message || 'Could not connect to backend to load preview data.');
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    }
    fetchPreview();
    return () => { isMounted = false; };
  }, [selectedDataset]);

  // Handle CSV file selection and upload
  const handleFileDrop = async (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Invalid file type: Please upload a standard comma-separated .csv file.');
      return;
    }

    setUploadFile(file);
    setUploadError(null);
    setUploadSuccess(null);
    setAnalysisError(null);
    setIsUploading(true);

    try {
      const uploadRes = await uploadCsvFile(file);
      setUploadDetails(uploadRes);
      setUploadSuccess(`Successfully uploaded and validated ${file.name} (${uploadRes.rows_count} rows, ${uploadRes.feature_names.length} numerical columns).`);
      setSelectedDataset(uploadRes.dataset_id);
      if (uploadRes.feature_names && uploadRes.feature_names.length > 0) {
        setSelectedFeature(uploadRes.feature_names[0]);
      }
      setPreviewData(uploadRes.preview);
    } catch (err) {
      setUploadError(err.message || 'CSV validation failed. Please check column format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyseData = async () => {
    setIsAnalysing(true);
    setAnalysisError(null);
    try {
      await executeDetection({
        dataset_id: selectedDataset,
        feature_name: selectedFeature,
      });
      navigate('/detect');
    } catch (err) {
      setAnalysisError(err.message || 'Analysis failed. Please ensure the Python backend is running.');
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = ['timestamp', 'magnetic_flux', 'current_helicity', 'shear_angle', 'free_energy', 'known_anomaly'];
    const sampleRows = [];
    for (let i = 0; i < 120; i++) {
      const isAnom = (i >= 40 && i <= 44) ? 1 : 0;
      const flux = (1200 + Math.sin(i / 10) * 150 + (isAnom ? 650 : 0) + Math.random() * 20).toFixed(2);
      const helicity = (45 + Math.cos(i / 8) * 10 + (isAnom ? 50 : 0) + Math.random() * 2).toFixed(2);
      const shear = (30 + Math.sin(i / 15) * 8 + (isAnom ? 25 : 0) + Math.random()).toFixed(2);
      const energy = (2.4 + Math.sin(i / 12) * 0.5 + (isAnom ? 1.8 : 0)).toFixed(3);
      sampleRows.push([`2026-01-01T${String(Math.floor(i / 5)).padStart(2, '0')}:${String((i % 5) * 12).padStart(2, '0')}:00`, flux, helicity, shear, energy, isAnom].join(','));
    }
    const csvStr = [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_multivariate_timeseries.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner and Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-plum-900/10 dark:border-coral-300/15">
        <div>
          <h2 className="font-heading text-2xl font-bold text-plum-900 dark:text-cream-200">
            Dataset Explorer & Preprocessing
          </h2>
          <p className="text-xs sm:text-sm text-plum-700/80 dark:text-coral-200/80 mt-1">
            SWAN-SF is the primary benchmark dataset. You can also upload your own compatible multivariate CSV.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-cream-100 dark:bg-plum-900/60 border border-plum-900/10 dark:border-coral-300/20 text-xs">
          <button
            onClick={() => handleTabChange('swan')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-heading font-semibold transition-all cursor-pointer ${
              activeTab === 'swan'
                ? 'bg-[#BD5579] text-white shadow-xs'
                : 'text-plum-800 dark:text-cream-200 hover:text-plum-950 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SWAN Dataset (Default)</span>
          </button>
          <button
            onClick={() => handleTabChange('upload')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-heading font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#BD5579] text-white shadow-xs'
                : 'text-plum-800 dark:text-cream-200 hover:text-plum-950 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom CSV</span>
          </button>
        </div>
      </div>

      {/* SWAN Overview Card */}
      {activeTab === 'swan' && (
        <div className="card-theme rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-berry-600/15 text-berry-700 dark:text-coral-300">
                <span>Verified Scientific Benchmark</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-cream-200">
                SWAN-SF: Space Weather ANalytics for Solar Flares
              </h3>
              <p className="text-xs text-plum-800/80 dark:text-cream-300/80 max-w-3xl leading-relaxed">
                Extracted from SDO-HMI Space Weather HMI Active Region Patches (SHARPs). Contains 24 multivariate physical magnetic field parameters sampled at 12-minute cadence over 12-hour windows (60 timesteps per region).
              </p>
            </div>
            <span className="font-mono text-xs px-3 py-1.5 rounded-xl bg-cream-200/60 dark:bg-plum-900/60 text-plum-900 dark:text-cream-200 border border-plum-900/10 dark:border-coral-300/15 font-semibold">
              Status: Loaded & Calibrated
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Evaluation Stream</span>
              <div className="font-mono text-xl font-bold text-plum-900 dark:text-cream-100 mt-1">2,400</div>
              <span className="text-[10px] text-plum-600 dark:text-cream-300/70">Continuous timesteps</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Physical Channels</span>
              <div className="font-mono text-xl font-bold text-berry-700 dark:text-coral-300 mt-1">24</div>
              <span className="text-[10px] text-plum-600 dark:text-cream-300/70">Photospheric parameters</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Solar Flares (Anomalies)</span>
              <div className="font-mono text-xl font-bold text-red-600 dark:text-red-400 mt-1">350</div>
              <span className="text-[10px] text-plum-600 dark:text-cream-300/70">Ground-truth timestamps</span>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 dark:bg-plum-900/40 border border-plum-900/10 dark:border-coral-300/10">
              <span className="text-[11px] text-plum-700 dark:text-coral-300 font-medium">Training Normal Stream</span>
              <div className="font-mono text-xl font-bold text-plum-900 dark:text-cream-100 mt-1">4,800</div>
              <span className="text-[10px] text-plum-600 dark:text-cream-300/70">Quiet-sun observations</span>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Tab Content */}
      {activeTab === 'upload' && (
        <div className="card-theme rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-cream-200">
                Upload Custom Time-Series CSV
              </h3>
              <p className="text-xs text-plum-800/80 dark:text-cream-300/80">
                Validate your CSV before analysis. The system inspects column types, null counts, and observation counts.
              </p>
            </div>
            <button
              onClick={handleDownloadSampleCsv}
              className="px-3.5 py-2 rounded-xl border border-berry-600/30 text-berry-800 dark:text-coral-200 bg-white/50 dark:bg-plum-900/40 hover:bg-berry-600/10 transition-colors text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop File Upload Box */}
          <div className="border-2 border-dashed border-plum-900/20 dark:border-coral-300/25 rounded-2xl p-8 text-center hover:border-berry-600 transition-colors bg-cream-50/50 dark:bg-plum-900/20">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={handleFileDrop}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
              <div className="w-12 h-12 rounded-xl bg-berry-600/15 text-berry-600 dark:text-coral-300 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm text-plum-900 dark:text-cream-200">
                  {uploadFile ? uploadFile.name : 'Click to select or drag and drop your CSV file'}
                </p>
                <p className="text-xs text-plum-700/80 dark:text-coral-200/70 mt-1">
                  Supported: Comma-separated time series with at least 1 numerical column and &gt;30 timesteps.
                </p>
              </div>
              <span className="inline-block px-4 py-2 rounded-xl btn-primary text-xs font-semibold shadow-xs">
                {isUploading ? 'Validating CSV...' : 'Select CSV File'}
              </span>
            </label>
          </div>

          {/* Upload Status / Error feedback */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Validation Warning</div>
                <div>{uploadError}</div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs space-y-3">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <div className="font-bold text-sm">Validation Passed: Ready for Analysis</div>
                  <div>{uploadSuccess}</div>
                  {uploadDetails?.has_ground_truth && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/15 border border-emerald-600/30 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                      <span>Ground-truth column detected:</span>
                      <code className="font-mono font-bold">{uploadDetails.ground_truth_column}</code>
                      <span>(Reserved strictly for model evaluation metrics)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Analyse Action Button inside Upload Box */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-600/20">
                <span className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                  Click to execute LFTSAD dual-scale neural reconstruction on uploaded time series:
                </span>
                <button
                  type="button"
                  onClick={handleAnalyseData}
                  disabled={isAnalysing}
                  id="analyse-data-direct-btn"
                  className="py-2 px-5 rounded-xl btn-primary font-heading font-semibold text-xs inline-flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAnalysing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analysing Data with LFTSAD...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Analyse Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Analysis Error</div>
                <div>{analysisError}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Numerical Variable Selection & Range Filtering */}
      <div className="card-theme rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-plum-900/10 dark:border-coral-300/15">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-berry-600 dark:text-coral-300" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-plum-900 dark:text-cream-200">
              Analysis Configuration: Variable & Window Range
            </h3>
          </div>
          <div className="text-xs text-plum-700 dark:text-coral-200">
            Select target variable for reconstruction visualization
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Feature Selector */}
          <div>
            <label className="font-heading font-semibold text-plum-900 dark:text-cream-200 block mb-1.5">
              Target Variable:
            </label>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-plum-900/15 dark:border-coral-300/20 bg-cream-50 dark:bg-plum-900/60 text-plum-900 dark:text-cream-100 font-mono font-medium focus:outline-hidden"
            >
              {(datasetMeta?.feature_names || uploadDetails?.feature_names || ['USFLUX']).map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </div>

          {/* Observation Window Selector */}
          <div>
            <label className="font-heading font-semibold text-plum-900 dark:text-cream-200 block mb-1.5">
              Initial Inspection Range:
            </label>
            <select
              value={`${timeRange[0]}-${timeRange[1]}`}
              onChange={(e) => {
                const [s, en] = e.target.value.split('-').map(Number);
                setTimeRange([s, en]);
              }}
              className="w-full px-3 py-2 rounded-xl border border-plum-900/15 dark:border-coral-300/20 bg-cream-50 dark:bg-plum-900/60 text-plum-900 dark:text-cream-100 font-mono font-medium focus:outline-hidden"
            >
              <option value="0-200">0 to 200 Timesteps (Initial Phase)</option>
              <option value="200-500">200 to 500 Timesteps (Active Flare Period)</option>
              <option value="500-1000">500 to 1,000 Timesteps</option>
              <option value="0-2400">Full Stream Window</option>
            </select>
          </div>

          {/* Confirm & Launch Analysis Action */}
          <div className="flex items-end">
            <button
              onClick={handleAnalyseData}
              disabled={isAnalysing}
              id="confirm-dataset-btn"
              className="w-full py-2.5 px-4 rounded-xl btn-primary font-heading font-semibold text-xs inline-flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isAnalysing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analysing Data with LFTSAD...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Analyse Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="card-theme rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-berry-600 dark:text-coral-300" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-plum-900 dark:text-cream-200">
              Data Preview (First 50 Observations)
            </h3>
          </div>
          <span className="font-mono text-xs text-berry-700 dark:text-coral-300">
            Real Values from Verified Schema
          </span>
        </div>

        {isLoadingPreview ? (
          <div className="py-12 text-center text-xs text-plum-700 dark:text-coral-200 flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border-2 border-berry-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading preview data from Python backend...</span>
          </div>
        ) : previewError ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{previewError}</span>
            </div>
            <button
              onClick={loadPreview}
              className="px-3 py-1.5 rounded-lg border border-amber-600/30 hover:bg-amber-600/15 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Preview</span>
            </button>
          </div>
        ) : previewData && previewData.columns ? (
          <div className="overflow-x-auto max-h-96 rounded-xl border border-plum-900/10 dark:border-coral-300/15">
            <table className="w-full text-xs text-left font-mono border-collapse">
              <thead className="sticky top-0 bg-cream-200/90 dark:bg-plum-900/90 backdrop-blur-xs text-plum-900 dark:text-cream-100 z-10">
                <tr className="border-b border-plum-900/15 dark:border-coral-300/20 font-bold">
                  <th className="py-2.5 px-3">Index</th>
                  {previewData.columns.slice(0, 10).map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  {previewData.columns.length > 10 && (
                    <th className="py-2.5 px-3 text-berry-700 dark:text-coral-300">
                      +{previewData.columns.length - 10} more cols
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-plum-900/5 dark:divide-coral-300/10 text-plum-900 dark:text-cream-200">
                {previewData.rows.map((row, rIdx) => (
                  <tr
                    key={`preview-row-${rIdx}`}
                    className="hover:bg-cream-100/50 dark:hover:bg-plum-900/40 transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold text-berry-700 dark:text-coral-300">{rIdx}</td>
                    {previewData.columns.slice(0, 10).map((col) => (
                      <td key={`${rIdx}-${col}`} className="py-2 px-3 whitespace-nowrap">
                        {typeof row[col] === 'number' ? row[col].toFixed(4) : String(row[col] || '')}
                      </td>
                    ))}
                    {previewData.columns.length > 10 && (
                      <td className="py-2 px-3 text-plum-500 dark:text-cream-300/50">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-plum-700 dark:text-coral-200">
            Preview will populate when the Python backend finishes loading.
          </div>
        )}
      </div>
    </div>
  );
}
