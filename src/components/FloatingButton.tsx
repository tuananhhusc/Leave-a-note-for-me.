'use client';

import { motion } from 'framer-motion';

type FloatingButtonProps = {
  onClick: () => void;
};

export default function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <motion.button
      id="write-note-fab"
      onClick={onClick}
      className="fixed bottom-8 left-1/2 z-[900] flex items-center gap-2 px-6 py-3.5 rounded-full text-white font-semibold text-sm sm:text-base shadow-xl cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #6366f1 100%)',
        boxShadow: '0 4px 24px rgba(59, 130, 246, 0.35), 0 2px 8px rgba(0,0,0,0.1)',
        x: '-50%',
      }}
      whileHover={{
        scale: 1.06,
        boxShadow: '0 6px 32px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0,0,0,0.15)',
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 4px 24px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.1)',
          '0 4px 32px rgba(59, 130, 246, 0.5), 0 4px 16px rgba(0,0,0,0.12)',
          '0 4px 24px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.1)',
        ],
      }}
      transition={{
        boxShadow: {
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    >
      <span className="text-lg">✍️</span>
      <span>Viết một note</span>
    </motion.button>
  );
}
