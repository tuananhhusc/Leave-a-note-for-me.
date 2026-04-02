'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Note } from '@/lib/supabase';
import StickyNote from '@/components/StickyNote';
import FloatingButton from '@/components/FloatingButton';
import WriteNoteModal from '@/components/WriteNoteModal';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function WallPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteIds, setNewNoteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const wallRef = useRef<HTMLDivElement>(null);

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
            // Avoid duplicate if we just inserted it ourselves
            if (prev.some((n) => n.id === newNote.id)) return prev;
            return [...prev, newNote];
          });
          setNewNoteIds((prev) => new Set(prev).add(newNote.id));

          // Remove "new" status after animation completes
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

  return (
    <div 
      className="relative flex flex-col min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ysof2.svg')" }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-50 flex justify-between items-start pointer-events-none">
        <Link 
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-xl text-blue-800 text-sm font-semibold shadow-sm border border-white hover:bg-white hover:shadow-md transition-all group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Trang chính
        </Link>
        
        {/* Note counter */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-sky-700 shadow-sm border border-white"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          {isLoading ? 'Đang tải...' : `${notes.length} note trên tường`}
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
          {!isLoading && notes.length === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-center px-4 glass p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)' }}>
                <p className="text-5xl sm:text-6xl mb-4 animate-bounce">📝</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
                  Bức tường còn trống...
                </p>
                <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">
                  Hãy là người đầu tiên để lại note nhé!
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md"
                >
                  Viết note ngay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        {notes.map((note, index) => (
          <StickyNote
            key={note.id}
            note={note}
            index={index}
            isNew={newNoteIds.has(note.id)}
          />
        ))}
      </div>

      {/* Floating action button */}
      <FloatingButton onClick={() => setIsModalOpen(true)} />

      {/* Write note modal */}
      <WriteNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
}
