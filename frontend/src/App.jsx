import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalysisProvider } from './contexts/AnalysisContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import ResearchImprovementsPage from './pages/ResearchImprovementsPage';
import ModelComparisonPage from './pages/ModelComparisonPage';
import MethodologyPage from './pages/MethodologyPage';
import ErrorBoundary from './components/ErrorBoundary';

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-cream/30 dark:bg-[#15040f] text-plum-950 dark:text-[#FFEBB8] transition-colors duration-200">
      {/* Responsive Left Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Header setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/dataset" element={<DatasetExplorerPage />} />
              <Route path="/detect" element={<AnomalyDetectionPage />} />
              <Route path="/improvements" element={<ResearchImprovementsPage />} />
              <Route path="/comparison" element={<ModelComparisonPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Global Footer */}
        <footer className="px-6 py-4 border-t border-plum-900/10 dark:border-coral-300/15 text-xs text-plum-700 dark:text-coral-300/80 flex flex-wrap items-center justify-between gap-2">
          <div className="font-heading font-medium">
            SignalSense &bull; Real Time-Series Anomaly Detection Platform
          </div>
          <div className="font-mono text-[11px]">
            LFTSAD &bull; Dual-Scale Discrepancy &bull; SWAN-SF SDO/HMI
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AnalysisProvider>
    </ThemeProvider>
  );
}
