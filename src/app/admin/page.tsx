'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Note } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ysof2025';

const themeBgs: Record<string, string> = {
  white: '#fffef7',
  'light-blue': '#f0f9ff',
  'dark-blue': '#e0f2fe',
  'mint-green': '#f0fdf4',
  lavender: '#f5f3ff',
  'soft-pink': '#fdf2f8',
  'sun-peach': '#fff7ed',
};

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'most-liked'>('newest');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
      setAuthError('');
      try {
        sessionStorage.setItem('ysof_admin', 'true');
      } catch { /* ignore */ }
    } else {
      setAuthError('Sai mật khẩu. Vui lòng thử lại.');
    }
  };

  // Check session on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem('ysof_admin') === 'true') {
        setIsAuth(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch notes when authenticated
  useEffect(() => {
    if (!isAuth) return;

    async function fetchNotes() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ysof_notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notes:', error);
        } else if (data) {
          setNotes(data as Note[]);
        }
      } catch (err) {
        console.error('Exception fetching notes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotes();
  }, [isAuth]);

  const handleDelete = useCallback(async (noteId: string) => {
    const { error } = await supabase
      .from('ysof_notes')
      .delete()
      .eq('id', noteId);

    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
    setDeleteConfirm(null);
  }, []);

  const handleLogout = () => {
    setIsAuth(false);
    setPassword('');
    try {
      sessionStorage.removeItem('ysof_admin');
    } catch { /* ignore */ }
  };

  // Filter and sort
  const displayedNotes = notes
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.content.toLowerCase().includes(q) ||
        (n.author || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return (b.likes || 0) - (a.likes || 0);
    });

  // Stats
  const totalNotes = notes.length;
  const totalLikes = notes.reduce((sum, n) => sum + (n.likes || 0), 0);
  const todayNotes = notes.filter((n) => {
    const noteDate = new Date(n.created_at);
    const today = new Date();
    return noteDate.toDateString() === today.toDateString();
  }).length;

  // Login screen
  if (!isAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 25%, #f5f3ff 50%, #fce7f3 75%, #fff7ed 100%)',
        }}
      >
        <motion.div
          className="w-full max-w-sm rounded-2xl p-8"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">🔐</span>
            <h1 className="text-xl font-bold text-gray-800">Quản trị YSOF Wall</h1>
            <p className="text-sm text-gray-500 mt-1">Nhập mật khẩu để tiếp tục</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Mật khẩu..."
              className="w-full px-4 py-3 rounded-xl bg-white/70 border border-white/80 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 transition-all"
            />

            {authError && (
              <p className="text-sm text-red-500 text-center">{authError}</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Đăng nhập
            </button>

            <Link
              href="/"
              className="block text-center text-sm text-gray-500 hover:text-sky-600 transition-colors"
            >
              ← Quay lại trang chính
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 25%, #f5f3ff 50%, #fce7f3 75%, #fff7ed 100%)',
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              🛡️ Quản trị YSOF Wall
            </h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý tất cả note trên bức tường</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/wall"
              className="px-4 py-2 rounded-xl bg-sky-100 text-sky-700 text-sm font-semibold hover:bg-sky-200 transition-colors"
            >
              👀 Xem tường
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Tổng note', value: totalNotes, icon: '📝', color: 'from-sky-400 to-blue-500' },
            { label: 'Hôm nay', value: todayNotes, icon: '🕐', color: 'from-violet-400 to-purple-500' },
            { label: 'Tổng lượt thích', value: totalLikes, icon: '💙', color: 'from-pink-400 to-rose-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 sm:p-5"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <p className="text-sm text-gray-500 font-medium">{stat.icon} {stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/70 border border-white/80 text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 transition-all"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="px-4 py-2.5 rounded-xl bg-white/70 border border-white/80 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 transition-all"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="most-liked">Nhiều like nhất</option>
          </select>
        </div>
      </div>

      {/* Notes Table */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{
                  background: themeBgs[note.theme] || '#fffef7',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-gray-800 break-words" style={{ fontFamily: 'var(--font-handwriting)' }}>
                    &ldquo;{note.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>— {note.author || 'Ẩn danh'}</span>
                    <span>•</span>
                    <span>{new Date(note.created_at).toLocaleString('vi-VN')}</span>
                    <span>•</span>
                    <span>💙 {note.likes || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <AnimatePresence>
                    {deleteConfirm === note.id ? (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <span className="text-xs text-red-500 font-medium">Chắc chắn?</span>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors active:scale-95"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-300 transition-colors active:scale-95"
                        >
                          Hủy
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(note.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors active:scale-95"
                      >
                        🗑 Xóa
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {displayedNotes.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-500 font-medium">Không có note nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
