'use client';

import { useEffect, useState, useCallback } from 'react';
import { Note, normalizeNote } from '@/lib/supabase';
import { getSupabaseErrorInfo } from '@/lib/errors';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!password.trim()) {
      setAuthError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAuthError(data.error || 'Sai mật khẩu. Vui lòng thử lại.');
      } else {
        setIsAuth(true);
        try {
          sessionStorage.setItem('toi_va_ban_admin', 'true');
          sessionStorage.setItem('toi_va_ban_admin_pw', password);
        } catch { /* ignore */ }
      }
    } catch {
      setAuthError('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getAdminPasswordForApi = useCallback(() => {
    try {
      return password || sessionStorage.getItem('toi_va_ban_admin_pw') || '';
    } catch {
      return password;
    }
  }, [password]);

  // Check session on mount
  useEffect(() => {
    try {
      const oldKey = 'ysof_admin';
      const newKey = 'toi_va_ban_admin';
      const oldValue = sessionStorage.getItem(oldKey);
      const newValue = sessionStorage.getItem(newKey);
      if (oldValue !== null && newValue === null) {
        sessionStorage.setItem(newKey, oldValue);
        sessionStorage.removeItem(oldKey);
      }

      if (sessionStorage.getItem(newKey) === 'true') {
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
        const res = await fetch('/api/admin/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const json = await res.json();

        if (!res.ok) {
          console.error('Error fetching notes:', json.error);
        } else if (json.notes) {
          const fetchedNotes = (json.notes as Record<string, unknown>[]).map(normalizeNote);
          setNotes(fetchedNotes);
          setReplyDrafts(
            fetchedNotes.reduce<Record<string, string>>((acc, note) => {
              acc[note.id] = note.admin_reply || '';
              return acc;
            }, {})
          );
        }
      } catch (err) {
        console.error('Exception fetching notes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotes();
  }, [isAuth, password]);

  const handleDelete = useCallback(async (noteId: string) => {
    const pw = getAdminPasswordForApi();
    if (!pw) {
      setReplyError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      setDeleteConfirm(null);
      return;
    }

    const res = await fetch('/api/admin/delete-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, noteId }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      hint?: string;
      code?: string;
    };

    if (!res.ok) {
      const info = getSupabaseErrorInfo(payload);
      setReplyError(
        payload.error ||
          info.hint ||
          info.message ||
          'Không thể xóa note lúc này. Vui lòng thử lại.'
      );
      console.error('Admin delete API error:', payload);
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast('Đã xóa note thành công!', 'success');
    }
    setDeleteConfirm(null);
  }, [getAdminPasswordForApi, showToast]);

  const handleToggleVisibility = useCallback(async (noteId: string, currentHidden: boolean) => {
    const pw = getAdminPasswordForApi();
    if (!pw) {
      setReplyError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const res = await fetch('/api/admin/toggle-visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, noteId, hidden: !currentHidden }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      note?: { id: string; hidden: boolean };
    };

    if (!res.ok) {
      setReplyError(payload.error || 'Không thể thay đổi trạng thái.');
      console.error('Toggle visibility error:', payload);
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, hidden: !currentHidden } : n))
      );
      showToast(!currentHidden ? 'Đã ẩn note!' : 'Đã hiện note!', 'success');
    }
  }, [getAdminPasswordForApi, showToast]);

  const handleReplyChange = useCallback((noteId: string, value: string) => {
    if (replyError) setReplyError('');
    setReplyDrafts((prev) => ({ ...prev, [noteId]: value }));
  }, [replyError]);

  const handleSaveReply = useCallback(async (noteId: string) => {
    const rawReply = replyDrafts[noteId] || '';
    const trimmedReply = rawReply.trim();
    const replyText = trimmedReply ? trimmedReply.slice(0, 500) : null;

    const pw = getAdminPasswordForApi();
    if (!pw) {
      setReplyError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    setSavingReplyId(noteId);
    const res = await fetch('/api/admin/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, noteId, reply: replyText }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      hint?: string;
      code?: string;
      note?: Record<string, unknown>;
    };

    setSavingReplyId(null);

    if (!res.ok) {
      const info = getSupabaseErrorInfo(payload);
      console.error('Admin reply API error:', payload);
      if (payload.code === '42703' || String(payload.error || '').includes('admin_reply')) {
        setReplyError(
          'Database chưa có cột admin_reply/replied_at. Hãy chạy migration mới trong supabase_schema.sql.'
        );
      } else {
        setReplyError(
          payload.error ||
            info.hint ||
            info.message ||
            'Không thể lưu trả lời lúc này. Vui lòng thử lại.'
        );
      }
      return;
    }

    const row = payload.note;
    const nowIso =
      typeof row?.replied_at === 'string'
        ? row.replied_at
        : replyText
          ? new Date().toISOString()
          : null;

    setReplyError('');
    setReplyDrafts((prev) => ({ ...prev, [noteId]: replyText || '' }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              admin_reply: replyText,
              replied_at: nowIso,
            }
          : n
      )
    );
    showToast(replyText ? 'Đã lưu trả lời!' : 'Đã xóa trả lời!', 'success');
  }, [replyDrafts, getAdminPasswordForApi, showToast]);

  const handleLogout = () => {
    setIsAuth(false);
    setPassword('');
    try {
      sessionStorage.removeItem('toi_va_ban_admin');
      sessionStorage.removeItem('toi_va_ban_admin_pw');
    } catch { /* ignore */ }
  };

  const handleExportCSV = useCallback(async () => {
    const pw = getAdminPasswordForApi();
    if (!pw) {
      showToast('Phiên đăng nhập hết hạn.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Export thất bại.', 'error');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống file CSV!', 'success');
    } catch {
      showToast('Export thất bại.', 'error');
    }
  }, [getAdminPasswordForApi, showToast]);

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
            <h1 className="text-xl font-bold text-gray-800">Quản trị Bức Tường</h1>
            <p className="text-sm text-gray-500 mt-1">Nhập mật khẩu để tiếp tục</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !isLoggingIn && handleLogin()}
              placeholder="Mật khẩu..."
              disabled={isLoggingIn}
              className="w-full px-4 py-3 rounded-xl bg-white/70 border border-white/80 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 transition-all disabled:opacity-60"
            />

            {authError && (
              <p className="text-sm text-red-500 text-center">{authError}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xác thực...
                </span>
              ) : (
                'Đăng nhập'
              )}
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
              🛡️ Quản trị Bức Tường
            </h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý tất cả note trên bức tường</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
            >
              📥 Export CSV
            </button>
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
        {replyError && (
          <div className="mb-3 rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100">
            {replyError}
          </div>
        )}
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
                <div className={`flex-1 min-w-0 ${note.hidden ? 'opacity-60' : ''}`}>
                  {note.hidden && (
                    <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold uppercase tracking-wide">
                      Đã ẩn
                    </span>
                  )}
                  <p className="text-sm sm:text-base text-gray-800 break-words" style={{ fontFamily: 'var(--font-handwriting)' }}>
                    &ldquo;{note.content}&rdquo;
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>— {note.author || 'Ẩn danh'}</span>
                    <span>•</span>
                    <span>{new Date(note.created_at).toLocaleString('vi-VN')}</span>
                    <span>•</span>
                    <span>💙 {note.likes || 0}</span>
                    {note.email && (
                      <>
                        <span>•</span>
                        <a
                          href={`mailto:${note.email}`}
                          className="text-sky-600 hover:text-sky-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📧 {note.email}
                        </a>
                      </>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phản hồi từ admin
                    </label>
                    <textarea
                      value={replyDrafts[note.id] ?? note.admin_reply ?? ''}
                      onChange={(e) => handleReplyChange(note.id, e.target.value.slice(0, 500))}
                      placeholder="Viết câu trả lời cho note này..."
                      className="w-full min-h-[76px] rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
                    />
                    <div className="mt-1 text-[11px] text-gray-400 text-right">
                      {(replyDrafts[note.id] ?? note.admin_reply ?? '').length}/500
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSaveReply(note.id)}
                    disabled={savingReplyId === note.id}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingReplyId === note.id ? 'Đang lưu...' : '💬 Lưu trả lời'}
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(note.id, note.hidden)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                      note.hidden
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={note.hidden ? 'Hiện note này trên tường' : 'Ẩn note này khỏi tường'}
                  >
                    {note.hidden ? '👁️ Hiện' : '🙈 Ẩn'}
                  </button>
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
