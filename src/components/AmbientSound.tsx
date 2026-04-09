'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const MUSIC_FILE = '/Blank Space - Taylor Swift - Violin, Guitar, Piano Cover - Daniel Jang - Daniel Jang.mp3';

export default function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(MUSIC_FILE);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.45;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Không thể phát nhạc nền:', err);
      });
    }

    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Save preference to localStorage
  useEffect(() => {
    try {
      const oldKey = 'ysof_ambient_sound';
      const newKey = 'toi_va_ban_ambient_sound';
      const oldValue = localStorage.getItem(oldKey);
      const newValue = localStorage.getItem(newKey);
      if (oldValue !== null && newValue === null) {
        localStorage.setItem(newKey, oldValue);
        localStorage.removeItem(oldKey);
      }

      const saved = localStorage.getItem(newKey);
      if (saved === 'true') {
        setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('toi_va_ban_ambient_sound', String(isPlaying));
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Keep audio element in sync with UI state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Không thể phát nhạc nền:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <button
      onClick={togglePlay}
      className="fixed bottom-8 right-6 z-[900] w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        background: isPlaying
          ? 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: isPlaying
          ? '0 4px 20px rgba(56, 189, 248, 0.3)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        color: isPlaying ? '#fff' : '#64748b',
      }}
      aria-label={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      title={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
    >
      {isPlaying ? '🔊' : '🔇'}
    </button>
  );
}
