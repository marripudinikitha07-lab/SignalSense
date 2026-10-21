const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch dataset list');
  return res.json();
}

export async function fetchDatasetMetadata(datasetId = 'swan') {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/metadata`);
  if (!res.ok) throw new Error(`Failed to fetch metadata for ${datasetId}`);
  return res.json();
}

export async function fetchDatasetPreview(datasetId = 'swan', limit = 100) {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/preview?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch dataset preview');
  return res.json();
}

export async function uploadCsvFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function runDetection(config) {
  const res = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Detection failed' }));
    throw new Error(err.detail || 'Detection failed');
  }
  return res.json();
}

export async function autoSelectAlpha(datasetId = 'swan', metric = 'separation') {
  const res = await fetch(`${API_BASE}/alpha/auto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, selection_criterion: metric }),
  });
  if (!res.ok) throw new Error('Automatic alpha selection failed');
  return res.json();
}

export async function recalculateWithAlpha(payload) {
  const res = await fetch(`${API_BASE}/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Recalculation failed');
  return res.json();
}

export async function fetchModelComparison(datasetId = 'swan') {
  const res = await fetch(`${API_BASE}/comparison?dataset_id=${datasetId}`);
  if (!res.ok) throw new Error('Failed to fetch model comparison');
  return res.json();
}

export async function exportAnalysisCsv(payload) {
  const res = await fetch(`${API_BASE}/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}
