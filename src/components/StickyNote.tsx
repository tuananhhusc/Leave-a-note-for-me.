'use client';

import { motion } from 'framer-motion';
import { Note, supabase, NOTES_TABLE } from '@/lib/supabase';
import { useMemo, useState, useEffect, useCallback } from 'react';

const TRUNCATE_LENGTH = 80;

const themeStyles: Record<Note['theme'], { bg: string; text: string; shadow: string }> = {
  white: {
    bg: 'bg-[#fffef7]',
    text: 'text-gray-700',
    shadow: 'shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
  },
  'light-blue': {
    bg: 'bg-[#f0f9ff]',
    text: 'text-blue-900',
    shadow: 'shadow-[0_4px_16px_rgba(14,165,233,0.08)]',
  },
  'dark-blue': {
    bg: 'bg-[#e0f2fe]',
    text: 'text-blue-950',
    shadow: 'shadow-[0_4px_16px_rgba(30,64,175,0.1)]',
  },
  'mint-green': {
    bg: 'bg-[#f0fdf4]',
    text: 'text-green-900',
    shadow: 'shadow-[0_4px_16px_rgba(22,163,74,0.06)]',
  },
  lavender: {
    bg: 'bg-[#f5f3ff]',
    text: 'text-violet-900',
    shadow: 'shadow-[0_4px_16px_rgba(124,58,237,0.06)]',
  },
  'soft-pink': {
    bg: 'bg-[#fdf2f8]',
    text: 'text-pink-900',
    shadow: 'shadow-[0_4px_16px_rgba(219,39,119,0.06)]',
  },
  'sun-peach': {
    bg: 'bg-[#fff7ed]',
    text: 'text-orange-900',
    shadow: 'shadow-[0_4px_16px_rgba(234,88,12,0.06)]',
  },
};

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

type StickyNoteProps = {
  note: Note;
  index: number;
  isNew?: boolean;
  layoutX?: number;
  layoutY?: number;
  onClick?: (note: Note) => void;
  onLikeUpdate?: (noteId: string, newLikes: number) => void;
};

export default function StickyNote({ note, index, isNew = false, onClick, onLikeUpdate }: StickyNoteProps) {
  const [mounted, setMounted] = useState(false);
  const [likes, setLikes] = useState(note.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showMiniHeart, setShowMiniHeart] = useState(false);
  const style = themeStyles[note.theme] || themeStyles.white;

  const isTruncated = note.content.length > TRUNCATE_LENGTH;
  const displayContent = isTruncated
    ? note.content.slice(0, TRUNCATE_LENGTH) + '...'
    : note.content;

  useEffect(() => {
    setMounted(true);
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
      // ignore
    }
  }, [note.id]);

  useEffect(() => {
    setLikes(note.likes || 0);
  }, [note.likes]);

  const rotation = useMemo(() => {
    const r = note.rotation || 0;
    return Math.max(-6, Math.min(6, r * 0.4));
  }, [note.rotation]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    setShowMiniHeart(true);
    setTimeout(() => setShowMiniHeart(false), 800);

    try {
      const likedNotes = JSON.parse(localStorage.getItem('toi_va_ban_liked_notes') || '[]');
      likedNotes.push(note.id);
      localStorage.setItem('toi_va_ban_liked_notes', JSON.stringify(likedNotes));
    } catch { /* ignore */ }

    await supabase
      .from(NOTES_TABLE)
      .update({ likes: newLikes })
      .eq('id', note.id);

    onLikeUpdate?.(note.id, newLikes);
  }, [hasLiked, likes, note.id, onLikeUpdate]);

  return (
    <motion.div
      className="cursor-pointer group"
      style={{ rotate: `${rotation}deg` }}
      initial={
        isNew
          ? { opacity: 0, scale: 0.3, y: 60 }
          : { opacity: 0, scale: 0.9, y: 20 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        isNew
          ? { type: 'spring', stiffness: 120, damping: 14 }
          : { delay: Math.min(index * 0.03, 0.5), duration: 0.35, ease: 'easeOut' }
      }
      whileHover={{
        scale: 1.05,
        rotate: 0,
        zIndex: 50,
        transition: { duration: 0.2 },
      }}
      onClick={() => onClick?.(note)}
    >
      {/* Pin */}
      <div className="pin" />

      {/* Note card */}
      <div
        className={`
          relative
          ${style.bg} ${style.text} ${style.shadow}
          rounded-lg p-4 pt-5
          border border-white/60
          transition-shadow duration-300
          group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
          min-h-[140px] flex flex-col
        `}
      >
        {/* Fold corner */}
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[18px] border-r-[18px] border-t-transparent border-r-white/30 rounded-bl-sm" />

        {/* Mini heart animation */}
        {showMiniHeart && (
          <motion.span
            className="absolute -top-3 right-2 text-lg pointer-events-none"
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -20, scale: 1.5 }}
            transition={{ duration: 0.7 }}
          >
            💙
          </motion.span>
        )}

        {/* Content */}
        <p
          className="text-sm leading-relaxed break-words flex-1"
          style={{ fontFamily: 'var(--font-handwriting)', fontSize: '1rem' }}
        >
          {displayContent}
        </p>

        {isTruncated && (
          <span className="text-[10px] text-sky-500 font-medium mt-1">
            Nhấn để đọc tiếp...
          </span>
        )}

        {/* Admin reply indicator */}
        {note.admin_reply && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-sky-600 font-medium">
            <span>💬</span> Admin đã trả lời
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between gap-1">
          <span
            className="text-[10px] sm:text-xs font-medium opacity-60 truncate max-w-[45%]"
          >
            — {note.author || 'Ẩn danh'}
          </span>

          <button
            onClick={handleLike}
            aria-label={hasLiked ? 'Đã thích' : 'Thích'}
            className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all ${
              hasLiked
                ? 'text-sky-500'
                : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-sky-500'
            }`}
          >
            <span className="text-xs">{hasLiked ? '💙' : '🤍'}</span>
            {likes > 0 && <span>{likes}</span>}
          </button>

          <span className="text-[9px] sm:text-[10px] opacity-40 whitespace-nowrap">
            {mounted ? relativeTime(note.created_at) : '...'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
