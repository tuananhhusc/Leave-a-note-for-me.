'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { supabase, Note } from '@/lib/supabase';

type Theme = Note['theme'];

const themes: { value: Theme; label: string; bg: string; ring: string }[] = [
  { value: 'white', label: 'Trắng', bg: 'bg-[#fffef7]', ring: 'ring-amber-200' },
  { value: 'light-blue', label: 'Xanh nhạt', bg: 'bg-[#f0f9ff]', ring: 'ring-sky-300' },
  { value: 'dark-blue', label: 'Xanh đậm', bg: 'bg-[#e0f2fe]', ring: 'ring-blue-400' },
];

type WriteNoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated?: (note: Note) => void;
};

export default function WriteNoteModal({ isOpen, onClose, onNoteCreated }: WriteNoteModalProps) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [theme, setTheme] = useState<Theme>('white');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasWrittenBefore, setHasWrittenBefore] = useState(false);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('ysof_note_written') === 'true') {
          setHasWrittenBefore(true);
        }
      } catch (e) {
        // Ignore localStorage access errors
      }
    }
  }, [isOpen]);

  const maxChars = 150;

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      setError('Hãy viết gì đó nhé! 💙');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const x_percent = 5 + Math.random() * 90;
    const y_percent = 10 + Math.random() * 75;
    const rotation = -10 + Math.random() * 20;

    const noteData = {
      content: content.trim(),
      author: author.trim() || 'Ẩn danh',
      theme,
      x_percent: parseFloat(x_percent.toFixed(2)),
      y_percent: parseFloat(y_percent.toFixed(2)),
      rotation: parseFloat(rotation.toFixed(2)),
    };

    const { data, error: dbError } = await supabase
      .from('ysof_notes')
      .insert([noteData])
      .select()
      .single();

    setIsSubmitting(false);

    if (dbError) {
      setError('Có lỗi xảy ra. Hãy thử lại nhé!');
      console.error('Supabase insert error:', dbError);
      return;
    }

    if (data && onNoteCreated) {
      onNoteCreated(data as Note);
    }

    try {
      localStorage.setItem('ysof_note_written', 'true');
      setHasWrittenBefore(true);
    } catch (e) {
      // Ignore localStorage access errors
    }

    // Reset form
    setContent('');
    setAuthor('');
    setTheme('white');
    onClose();
  }, [content, author, theme, onClose, onNoteCreated]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full max-w-md glass rounded-2xl p-6 sm:p-8"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {hasWrittenBefore ? 'Cảm ơn bạn nhé! 💖' : '✏️ Viết một note'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {hasWrittenBefore 
                  ? 'Bạn đã để lại một note rồi. Bức tường xin giữ lại mảnh ký ức này nhé!'
                  : 'Để lại một mảnh ký ức cho tương lai'}
              </p>
            </div>

            {hasWrittenBefore ? (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-10 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Tuyệt vời!
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Form */}
                {/* Content textarea */}
                <div>
                  <textarea
                    id="note-content"
                    value={content}
                    onChange={(e) => {
                      if (e.target.value.length <= maxChars) {
                        setContent(e.target.value);
                        setError('');
                      }
                    }}
                    placeholder="Bạn muốn nói gì với YSOF trong tương lai...?"
                    className="w-full h-28 px-4 py-3 rounded-xl bg-white/70 border border-white/80 text-gray-800 placeholder-gray-400 text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:border-sky-200 transition-all"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem' }}
                  />
                  <div className="flex justify-end mt-1">
                    <span
                      className={`text-xs transition-colors ${
                        content.length >= maxChars * 0.9
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {content.length}/{maxChars}
                    </span>
                  </div>
                </div>

                {/* Author input */}
                <div>
                  <input
                    id="note-author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value.slice(0, 100))}
                    placeholder="Tên của bạn... (hoặc để trống để ẩn danh)"
                    className="w-full px-4 py-3 rounded-xl bg-white/70 border border-white/80 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300/50 focus:border-sky-200 transition-all"
                  />
                </div>

                {/* Theme selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Màu note
                  </label>
                  <div className="flex gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTheme(t.value)}
                        className={`
                          w-10 h-10 rounded-full ${t.bg} border-2 transition-all duration-200
                          ${
                            theme === t.value
                              ? `ring-2 ${t.ring} ring-offset-2 border-transparent scale-110`
                              : 'border-gray-200 hover:scale-105'
                          }
                        `}
                        aria-label={t.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="text-sm text-red-500 text-center"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-white/50 transition-all active:scale-95"
                  >
                    Hủy
                  </button>
                  <button
                    id="submit-note-btn"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim()}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-white text-sm font-semibold transition-all active:scale-95
                      ${
                        isSubmitting || !content.trim()
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-md hover:shadow-lg'
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang dán...
                      </span>
                    ) : (
                      '📌 Dán lên tường'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
