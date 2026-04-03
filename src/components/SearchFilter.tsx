'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '@/lib/supabase';

const themeFilters: { value: Note['theme'] | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Tất cả', color: 'linear-gradient(135deg, #bae6fd, #c7d2fe, #fce7f3)' },
  { value: 'white', label: 'Trắng', color: '#fffef7' },
  { value: 'light-blue', label: 'Xanh nhạt', color: '#f0f9ff' },
  { value: 'dark-blue', label: 'Xanh đậm', color: '#e0f2fe' },
  { value: 'mint-green', label: 'Mint', color: '#f0fdf4' },
  { value: 'lavender', label: 'Tím', color: '#f5f3ff' },
  { value: 'soft-pink', label: 'Hồng', color: '#fdf2f8' },
  { value: 'sun-peach', label: 'Cam', color: '#fff7ed' },
];

type SearchFilterProps = {
  onSearchChange: (query: string) => void;
  onThemeFilter: (theme: Note['theme'] | 'all') => void;
  activeTheme: Note['theme'] | 'all';
};

export default function SearchFilter({ onSearchChange, onThemeFilter, activeTheme }: SearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    onSearchChange(val);
  };

  return (
    <div className="pointer-events-auto">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm border border-white transition-all hover:shadow-md active:scale-95"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          color: '#0369a1',
        }}
      >
        <span>{isOpen ? '✕' : '🔍'}</span>
        <span className="hidden sm:inline">{isOpen ? 'Đóng' : 'Tìm kiếm'}</span>
      </button>

      {/* Expanded search panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 w-[320px] sm:w-[380px] rounded-2xl p-4 space-y-3"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            {/* Search input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc nội dung..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/70 border border-white/80 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 transition-all"
              />
              {searchText && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Theme filter */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Lọc theo màu</p>
              <div className="flex flex-wrap gap-2">
                {themeFilters.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onThemeFilter(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 border ${
                      activeTheme === t.value
                        ? 'border-sky-400 shadow-sm ring-1 ring-sky-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ background: t.value === 'all' ? undefined : t.color }}
                  >
                    {t.value === 'all' && (
                      <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    )}
                    <span className="text-gray-600">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
