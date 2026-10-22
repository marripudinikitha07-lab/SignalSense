import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Database, Upload, LogIn, LogOut, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAnalysis } from '../contexts/AnalysisContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedDataset } = useAnalysis();
  const { user, isAuthenticated, logout } = useAuth();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Research Overview',
          subtitle: 'Find unusual patterns. Understand them easily.',
        };
      case '/dataset':
        return {
          title: 'Dataset Explorer',
          subtitle: 'Inspect solar active regions and multi-variate continuous time series',
        };
      case '/detect':
        return {
          title: 'Anomaly Detection Dashboard',
          subtitle: 'Dual-scale reconstruction discrepancies with interactive point explanation',
        };
      case '/improvements':
        return {
          title: 'Research Improvements',
          subtitle: 'Automatic alpha optimization & cross-variable correlation enhancements',
        };
      case '/comparison':
        return {
          title: 'Model Comparison & Benchmarks',
          subtitle: 'Empirical evaluation against original LFTSAD baseline on real data',
        };
      case '/methodology':
        return {
          title: 'Methodology & Research Notes',
          subtitle: 'Scientific principles, reconstruction mechanics, and limitation disclosures',
        };
      case '/login':
        return {
          title: 'Sign In',
          subtitle: 'Authenticate to access SignalSense model detection and workspace features',
        };
      case '/register':
        return {
          title: 'Register',
          subtitle: 'Create a new SignalSense researcher account',
        };
      default:
        return {
          title: 'SignalSense',
          subtitle: 'Lightweight & Fast Time-Series Anomaly Detection',
        };
    }
  };

  const info = getPageInfo();

  return (
    <header className="sticky top-0 z-30 bg-warm-cream/80 dark:bg-[#1f0918]/85 backdrop-blur-md border-b border-plum-900/10 dark:border-coral-300/15 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 rounded-xl text-plum-900 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-plum-900/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold text-plum-900 dark:text-cream-200 tracking-tight leading-tight">
              {info.title}
            </h1>
            <p className="text-xs text-berry-700 dark:text-coral-300 hidden sm:block font-medium">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions, User Profile & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active Dataset Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cream-100 dark:bg-plum-900/50 border border-plum-700/15 dark:border-coral-300/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-plum-900 dark:text-cream-200 font-medium">Dataset:</span>
            <span className="font-mono font-semibold text-berry-700 dark:text-coral-300 uppercase">
              {selectedDataset === 'swan' ? 'SWAN-SF' : 'Custom CSV'}
            </span>
          </div>

          {/* Quick Action: Explore SWAN */}
          <button
            onClick={() => navigate('/dataset')}
            className="hidden xl:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-berry-600/30 text-berry-800 dark:text-coral-200 bg-white/50 dark:bg-plum-900/40 hover:bg-berry-600/10 transition-colors text-xs font-medium"
          >
            <Database className="w-3.5 h-3.5 text-berry-600 dark:text-coral-300" />
            <span>SWAN Dataset</span>
          </button>

          {/* Quick Action: Upload Data */}
          <button
            onClick={() => navigate('/dataset?tab=upload')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg btn-primary text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-plum-900/10 dark:border-coral-300/15">
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-cream-200/70 dark:bg-plum-900/60 border border-plum-900/10 dark:border-coral-300/15 text-xs"
                title={`Signed in as ${user.email}`}
              >
                <div className="w-5 h-5 rounded-full bg-berry-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-plum-900 dark:text-cream-100 max-w-[100px] truncate hidden md:inline">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 rounded-lg text-plum-700 dark:text-coral-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-berry-600/40 text-berry-700 dark:text-coral-300 hover:bg-berry-600/10 transition-colors text-xs font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
