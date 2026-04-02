'use client';

import { motion } from 'framer-motion';
import { Note } from '@/lib/supabase';
import { useMemo } from 'react';

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
};

export default function StickyNote({ note, index, isNew = false }: StickyNoteProps) {
  const style = themeStyles[note.theme] || themeStyles.white;

  const floatDelay = useMemo(() => Math.random() * 3, []);
  const floatDuration = useMemo(() => 4 + Math.random() * 2, []);

  return (
    <motion.div
      className={`absolute w-[160px] sm:w-[180px] md:w-[200px] cursor-default group`}
      style={{
        left: `${note.x_percent}%`,
        top: `${note.y_percent}%`,
        zIndex: index + 1,
        transform: `translate(-50%, -50%)`,
      }}
      initial={
        isNew
          ? { opacity: 0, scale: 0.3, y: 300, x: 0 }
          : { opacity: 0, scale: 0.8 }
      }
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
      }}
      transition={
        isNew
          ? { type: 'spring', stiffness: 120, damping: 14, duration: 0.8 }
          : { delay: index * 0.05, duration: 0.4, ease: 'easeOut' }
      }
      whileHover={{
        scale: 1.08,
        zIndex: 999,
        rotate: 0,
        transition: { duration: 0.2 },
      }}
    >
      {/* Idle floating animation wrapper */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: floatDuration,
          delay: floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ rotate: `${note.rotation}deg` }}
      >
        {/* Pin */}
        <div className="pin" />

        {/* Note card */}
        <div
          className={`
            ${style.bg} ${style.text} ${style.shadow}
            rounded-lg p-4 pt-5
            border border-white/60
            transition-shadow duration-300
            group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
          `}
        >
          {/* Fold corner effect */}
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-white/30 rounded-bl-sm" />

          {/* Content */}
          <p
            className="text-sm sm:text-base leading-relaxed break-words"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem' }}
          >
            {note.content}
          </p>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
            <span
              className="text-[10px] sm:text-xs font-medium opacity-60 truncate max-w-[60%]"
            >
              — {note.author || 'Ẩn danh'}
            </span>
            <span className="text-[9px] sm:text-[10px] opacity-40 whitespace-nowrap">
              {relativeTime(note.created_at)}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
