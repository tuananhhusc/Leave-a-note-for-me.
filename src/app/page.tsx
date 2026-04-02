'use client';

import { useState } from 'react';
import WriteNoteModal from '@/components/WriteNoteModal';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleNoteCreated = () => {
    // When a note is created on the main page, automatically navigate to the wall
    router.push('/wall');
  };

  return (
    <div 
      className="relative flex flex-col flex-1 items-center justify-center min-h-[calc(100vh-100px)] p-4 sm:p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/ysof1.svg')" }}
    >
      
      {/* Header */}
      <motion.header
        className="relative z-10 text-center max-w-2xl mx-auto w-full p-4 sm:p-8"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-blue-600 leading-tight mb-8 tracking-wide pb-1"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(14, 165, 233, 0.15))' }}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
          >
            Hãy Để Lại Một Mảnh Ký Ức
            <br className="hidden sm:block" />
            Cho YSOF Trong Tương Lai <span className="inline-block animate-pulse">💙</span>
          </motion.h1>
        </motion.div>
        
        <motion.p
          className="text-lg sm:text-xl text-white mb-12 font-semibold drop-shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Viết một note ngắn, dán lên bức tường sự kiện, và lưu giữ khoảnh khắc này mãi mãi ✨
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -5, 0] }}
          transition={{ 
            opacity: { delay: 0.6, duration: 0.5 },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 } 
          }}
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #4f46e5 100%)',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
            }}
          >
            <span className="inline-block group-hover:-rotate-6 transition-transform mr-2">✍️</span> Viết một note mới
          </button>
          
          <Link
            href="/wall"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-blue-900 font-bold text-lg shadow-lg hover:bg-white border focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-105 transition-all duration-300 active:scale-95 group"
          >
            <span className="inline-block group-hover:scale-110 transition-transform mr-2">👀</span> Xem bức tường
          </Link>
        </motion.div>
      </motion.header>

      {/* Write note modal */}
      <WriteNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
}
