'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase, Note } from '@/lib/supabase';
import StickyNote from '@/components/StickyNote';
import FloatingButton from '@/components/FloatingButton';
import WriteNoteModal from '@/components/WriteNoteModal';
import NoteDetailModal from '@/components/NoteDetailModal';
import SearchFilter from '@/components/SearchFilter';
import Particles from '@/components/Particles';
import AmbientSound from '@/components/AmbientSound';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const BATCH_SIZE = 30;

export default function WallPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteIds, setNewNoteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<Note['theme'] | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const wallRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch existing notes
  useEffect(() => {
    async function fetchNotes() {
      try {
        const { data, error } = await supabase
          .from('ysof_notes')
          .select('*')
          .order('created_at', { ascending: true });

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
  }, []);

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel('ysof_notes_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ysof_notes' },
        (payload) => {
          const newNote = payload.new as Note;
          setNotes((prev) => {
            if (prev.some((n) => n.id === newNote.id)) return prev;
            return [...prev, newNote];
          });
          setNewNoteIds((prev) => new Set(prev).add(newNote.id));
          setTimeout(() => {
            setNewNoteIds((prev) => {
              const next = new Set(prev);
              next.delete(newNote.id);
              return next;
            });
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Handle note created from modal
  const handleNoteCreated = useCallback((note: Note) => {
    setNotes((prev) => {
      if (prev.some((n) => n.id === note.id)) return prev;
      return [...prev, note];
    });
    setNewNoteIds((prev) => new Set(prev).add(note.id));
    setTimeout(() => {
      setNewNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
    }, 1500);
  }, []);

  // Handle like update across components
  const handleLikeUpdate = useCallback((noteId: string, newLikes: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, likes: newLikes } : n))
    );
    // Also update selectedNote if viewing it
    setSelectedNote((prev) =>
      prev && prev.id === noteId ? { ...prev, likes: newLikes } : prev
    );
  }, []);

  // Filtered & searched notes
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          (n.author || '').toLowerCase().includes(q)
      );
    }

    // Theme filter
    if (themeFilter !== 'all') {
      result = result.filter((n) => n.theme === themeFilter);
    }

    return result;
  }, [notes, searchQuery, themeFilter]);

  // Only render up to visibleCount for performance
  const visibleNotes = filteredNotes.slice(0, visibleCount);

  const totalNotes = notes.length;
  const filteredCount = filteredNotes.length;
  const isFiltering = searchQuery.trim() || themeFilter !== 'all';

  return (
    <div 
      className="relative flex flex-col min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ysof2.svg')" }}
    >
      {/* Particles layer */}
      <Particles />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-50 flex justify-between items-start pointer-events-none">
        <div className="flex items-start gap-3 pointer-events-auto">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-xl text-blue-800 text-sm font-semibold shadow-sm border border-white hover:bg-white hover:shadow-md transition-all group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Trang chính
          </Link>

          {/* Search filter */}
          <div className="relative">
            <SearchFilter
              onSearchChange={setSearchQuery}
              onThemeFilter={setThemeFilter}
              activeTheme={themeFilter}
            />
          </div>
        </div>
        
        {/* Note counter */}
        <div
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-sky-700 shadow-sm border border-white"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          {isLoading
            ? 'Đang tải...'
            : isFiltering
              ? `${filteredCount}/${totalNotes} note`
              : `${totalNotes} note trên tường`}
        </div>
      </div>

      {/* Wall area */}
      <div
        ref={wallRef}
        className="relative flex-1 min-h-[600px] sm:min-h-[700px] md:min-h-screen z-10"
      >
        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              exit={{ opacity: 0 }}
            >
              <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-400 rounded-full animate-spin" />
              <p className="text-sm font-medium text-sky-800">Đang tải bức tường...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {!isLoading && filteredNotes.length === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-center px-4 glass p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)' }}>
                <p className="text-5xl sm:text-6xl mb-4 animate-bounce">
                  {isFiltering ? '🔍' : '📝'}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
                  {isFiltering ? 'Không tìm thấy note nào' : 'Bức tường còn trống...'}
                </p>
                <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">
                  {isFiltering
                    ? 'Thử từ khóa khác hoặc bỏ bộ lọc nhé!'
                    : 'Hãy là người đầu tiên để lại note nhé!'}
                </p>
                {!isFiltering && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md"
                  >
                    Viết note ngay
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        {visibleNotes.map((note, index) => (
          <StickyNote
            key={note.id}
            note={note}
            index={index}
            isNew={newNoteIds.has(note.id)}
            onClick={setSelectedNote}
            onLikeUpdate={handleLikeUpdate}
          />
        ))}

        {/* Lazy loading sentinel */}
        {visibleCount < filteredNotes.length && (
          <div ref={sentinelRef} className="absolute bottom-0 w-full h-20" />
        )}
      </div>

      {/* Floating action button */}
      <FloatingButton onClick={() => setIsModalOpen(true)} />

      {/* Ambient sound toggle */}
      <AmbientSound />

      {/* Write note modal */}
      <WriteNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNoteCreated={handleNoteCreated}
      />

      {/* Note detail modal */}
      <NoteDetailModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onLike={handleLikeUpdate}
      />
    </div>
  );
}
