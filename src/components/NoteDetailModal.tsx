'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Note, supabase, NOTES_TABLE } from '@/lib/supabase';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import { useReducedMotion } from '@/lib/useReducedMotion';

const themeLabels: Record<string, string> = {
  white: 'Trắng',
  'light-blue': 'Xanh nhạt',
  'dark-blue': 'Xanh đậm',
  'mint-green': 'Xanh lá mint',
  lavender: 'Tím oải hương',
  'soft-pink': 'Hồng nhạt',
  'sun-peach': 'Cam đào',
};

const themeBgs: Record<string, string> = {
  white: '#fffef7',
  'light-blue': '#f0f9ff',
  'dark-blue': '#e0f2fe',
  'mint-green': '#f0fdf4',
  lavender: '#f5f3ff',
  'soft-pink': '#fdf2f8',
  'sun-peach': '#fff7ed',
};

type NoteDetailModalProps = {
  note: Note | null;
  onClose: () => void;
  onLike?: (noteId: string, newLikes: number) => void;
};

export default function NoteDetailModal({ note, onClose, onLike }: NoteDetailModalProps) {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const modalAnimation = useMemo(() => {
    const transition: Transition = prefersReducedMotion
      ? { duration: 0.1 }
      : { type: 'spring', stiffness: 300, damping: 25 };

    return {
    initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 60 },
    animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
    exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 60 },
      transition,
    };
  }, [prefersReducedMotion]);

  // Handle Escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (note) {
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [note, handleKeyDown]);

  useEffect(() => {
    if (note) {
      setLikes(note.likes || 0);
      try {
        const oldKey = 'ysof_liked_notes';
        const newKey = 'toi_va_ban_liked_notes';
        const oldValue = localStorage.getItem(oldKey);
        const newValue = localStorage.getItem(newKey);
        if (oldValue !== null && newValue === null) {
          localStorage.setItem(newKey, oldValue);
          localStorage.removeItem(oldKey);
        }

        const likedNotes = JSON.parse(localStorage.getItem(newKey) || '[]');
        setHasLiked(likedNotes.includes(note.id));
      } catch {
        setHasLiked(false);
      }
    }
  }, [note]);

  const handleLike = async () => {
    if (!note || hasLiked) return;

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 1000);

    // Save to localStorage
    try {
      const likedNotes = JSON.parse(localStorage.getItem('toi_va_ban_liked_notes') || '[]');
      likedNotes.push(note.id);
      localStorage.setItem('toi_va_ban_liked_notes', JSON.stringify(likedNotes));
    } catch { /* ignore */ }

    // Update in Supabase
    await supabase
      .from(NOTES_TABLE)
      .update({ likes: newLikes })
      .eq('id', note.id);

    onLike?.(note.id, newLikes);
  };

  const handleShare = async () => {
    if (!note) return;

    const shareText = `"${note.content}" — ${note.author || 'Ẩn danh'}\n\n💙 Bức Tường Tương Lai`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    // Try native share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Bức Tường Tương Lai',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share API failed, fallback to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      showToast('Đã copy vào clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể copy, vui lòng thử lại!', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-detail-title"
            className="relative w-full max-w-sm rounded-2xl p-6 sm:p-8 overflow-hidden"
            initial={modalAnimation.initial}
            animate={modalAnimation.animate}
            exit={modalAnimation.exit}
            transition={modalAnimation.transition}
            style={{
              background: themeBgs[note.theme] || '#fffef7',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Đóng"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            {/* Theme badge */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-3 h-3 rounded-full border border-white/60"
                style={{ background: themeBgs[note.theme] }}
              />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                {themeLabels[note.theme] || 'Note'}
              </span>
            </div>

            {/* Content */}
            <p
              id="note-detail-title"
              className="text-xl sm:text-2xl leading-relaxed break-words text-gray-800 mb-6"
              style={{ fontFamily: 'var(--font-handwriting)', lineHeight: 1.6 }}
            >
              &ldquo;{note.content}&rdquo;
            </p>

            {/* Author & Date */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-600">
                — {note.author || 'Ẩn danh'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(note.created_at)}
              </p>
            </div>

            {note.admin_reply && (
              <div className="mb-6 rounded-xl bg-white/60 border border-white/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-sky-600">
                  Trả lời từ admin
                </p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed break-words">
                  {note.admin_reply}
                </p>
                {note.replied_at && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    {formatDate(note.replied_at)}
                  </p>
                )}
              </div>
            )}

            {/* Heart flying animation */}
            <AnimatePresence>
              {showHeartAnim && (
                <motion.div
                  className="absolute left-1/2 top-1/2 text-4xl pointer-events-none"
                  initial={{ opacity: 1, scale: 0.5, x: '-50%', y: '-50%' }}
                  animate={{ opacity: 0, scale: 2, y: '-200%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  💙
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              {/* Like */}
              <button
                onClick={handleLike}
                disabled={hasLiked}
                aria-label={hasLiked ? `Đã thích - ${likes} lượt thích` : `Thích note này - ${likes} lượt thích`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                  hasLiked
                    ? 'bg-sky-100 text-sky-600 cursor-default'
                    : 'bg-black/5 hover:bg-sky-50 text-gray-500 hover:text-sky-600'
                }`}
              >
                <motion.span
                  animate={hasLiked ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {hasLiked ? '💙' : '🤍'}
                </motion.span>
                <span>{likes}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                aria-label="Chia sẻ note này"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-sm font-medium transition-all active:scale-95"
              >
                {copied ? '✅ Đã copy!' : '↗ Chia sẻ'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
