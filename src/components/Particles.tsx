'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDir: number;
  hue: number;
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.w === 0 || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.w;
    canvas.height = dimensions.h;

    // Initialize particles
    const count = Math.min(Math.floor(dimensions.w * dimensions.h / 25000), 40);
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * dimensions.w,
        y: Math.random() * dimensions.h,
        size: 1.5 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.15 - Math.random() * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        opacityDir: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003),
        hue: 200 + Math.random() * 40, // sky-blue hue range
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Update opacity (twinkle)
        p.opacity += p.opacityDir;
        if (p.opacity > 0.5) p.opacityDir = -Math.abs(p.opacityDir);
        if (p.opacity < 0.05) p.opacityDir = Math.abs(p.opacityDir);

        // Wrap around
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 85%, 1)`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 80%, 0.4)`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 75%, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [dimensions, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[5]"
      style={{ opacity: 0.7 }}
    />
  );
}
