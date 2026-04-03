'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gains: GainNode[]; oscillators: OscillatorNode[] }>({ gains: [], oscillators: [] });

  // Create ambient wind-like sound using Web Audio API
  const initAudio = useCallback(() => {
    if (isInitialized) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    const gains: GainNode[] = [masterGain];
    const oscillators: OscillatorNode[] = [];

    // Create several filtered noise layers for ambient wind
    for (let i = 0; i < 3; i++) {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        output[j] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200 + i * 100;
      filter.Q.value = 0.5;

      const layerGain = ctx.createGain();
      layerGain.gain.value = 0.03 - i * 0.008;

      whiteNoise.connect(filter);
      filter.connect(layerGain);
      layerGain.connect(masterGain);
      whiteNoise.start();

      gains.push(layerGain);
    }

    // Add very soft tonal pad
    const padFreqs = [220, 277.18, 329.63]; // A3, C#4, E4 — A major chord
    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.008;

      // Slow tremolo
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + i * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.004;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();

      oscillators.push(osc, lfo);
      gains.push(oscGain);
    });

    nodesRef.current = { gains, oscillators };
    setIsInitialized(true);
  }, [isInitialized]);

  const togglePlay = useCallback(() => {
    if (!isInitialized) {
      initAudio();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (isPlaying) {
      // Fade out
      nodesRef.current.gains[0]?.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } else {
      if (ctx.state === 'suspended') ctx.resume();
      // Fade in
      nodesRef.current.gains[0]?.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1);
    }

    setIsPlaying(!isPlaying);
  }, [isPlaying, isInitialized, initAudio]);

  // Save preference to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ysof_ambient_sound');
      if (saved === 'true' && !isInitialized) {
        // Auto-play requires user gesture; we only remember preference UI
      }
    } catch {
      // ignore
    }
  }, [isInitialized]);

  useEffect(() => {
    try {
      localStorage.setItem('ysof_ambient_sound', String(isPlaying));
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
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
