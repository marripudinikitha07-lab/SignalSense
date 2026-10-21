import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Database,
  Search,
  Sparkles,
  GitCompare,
  BookOpen,
  Menu,
  X,
  Radio,
} from 'lucide-react';

const navItems = [
  { name: 'Overview / Home', path: '/', icon: Activity },
  { name: 'Dataset Explorer', path: '/dataset', icon: Database },
  { name: 'Anomaly Detection', path: '/detect', icon: Search },
  { name: 'Research Improvements', path: '/improvements', icon: Sparkles },
  { name: 'Model Comparison', path: '/comparison', icon: GitCompare },
  { name: 'Methodology / About', path: '/methodology', icon: BookOpen },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-plum-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#601D49] text-[#FFEBB8] flex flex-col border-r border-berry-700/40 shadow-xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-berry-700/40 flex items-center justify-between">
          <NavLink to="/" className="flex items-center space-x-3 group" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BD5579] to-[#EA9D9D] p-2 flex items-center justify-center shadow-md">
              <Radio className="w-6 h-6 text-[#200718]" />
            </div>
            <div>
              <div className="font-heading font-bold text-xl tracking-tight text-[#FFEBB8] flex items-center gap-1.5">
                SignalSense
              </div>
              <div className="text-xs text-[#EA9D9D] tracking-wide font-medium">
                LFTSAD Research Platform
              </div>
            </div>
          </NavLink>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#EA9D9D] hover:bg-plum-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="primary-sidebar-nav">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-[#EA9D9D]/80">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#BD5579] text-white shadow-sm font-semibold translate-x-1'
                      : 'text-[#FFEBB8]/85 hover:text-white hover:bg-plum-800/70 hover:translate-x-0.5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-[#EA9D9D]" />
                <span className="font-heading truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* SWAN Status Badge Footer */}
        <div className="p-4 m-4 rounded-xl bg-plum-900/70 border border-berry-700/30 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-[#FFEBB8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              SWAN-SF Benchmark
            </span>
            <span className="font-mono text-[10px] text-[#EA9D9D] bg-plum-950 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-[#EA9D9D]/90 leading-relaxed">
            Multi-spectral solar active region time-series with 24 physical magnetic parameters.
          </p>
        </div>
      </aside>
    </>
  );
}
