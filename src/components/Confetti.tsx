import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'square' | 'circle' | 'triangle';
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  /** If changes values, it triggers a confetti burst */
  triggerId: number;
  /** Amount of particles */
  count?: number;
  /** Burst origin 'center' or 'sides' or 'bottom' */
  origin?: 'center' | 'sides' | 'bottom';
}

export const Confetti: React.FC<ConfettiProps> = ({ 
  triggerId, 
  count = 80, 
  origin = 'center' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const colors = [
    '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', 
    '#8b5cf6', '#06b6d4', '#14b8a6', '#f43f5e', '#a855f7'
  ];

  const createParticle = (width: number, height: number): Particle => {
    let x = width / 2;
    let y = height / 2;
    let speedX = (Math.random() - 0.5) * 8;
    let speedY = -Math.random() * 8 - 4;

    if (origin === 'sides') {
      // split from left and right corners
      const isLeft = Math.random() > 0.5;
      x = isLeft ? 10 : width - 10;
      y = height - 10;
      speedX = isLeft ? (Math.random() * 8 + 4) : (-Math.random() * 8 - 4);
      speedY = -Math.random() * 12 - 6;
    } else if (origin === 'bottom') {
      x = Math.random() * width;
      y = height - 5;
      speedX = (Math.random() - 0.5) * 4;
      speedY = -Math.random() * 10 - 5;
    }

    return {
      x,
      y,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.6 ? 'circle' : Math.random() > 0.5 ? 'triangle' : 'square',
      speedX,
      speedY,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on container parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    const parent = canvas.parentElement;
    if (parent) resizeObserver.observe(parent);

    // Spawn initial particles burst whenever triggerId changes
    if (triggerId > 0) {
      const newParticles: Particle[] = [];
      const numParticles = count;
      for (let i = 0; i < numParticles; i++) {
        newParticles.push(createParticle(canvas.width, canvas.height));
      }
      // Add to existing particles
      particlesRef.current = [...particlesRef.current, ...newParticles].slice(0, 300); // hard limit
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Update physics
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.25; // gravity
        p.speedX *= 0.98; // wind drag
        p.rotation += p.rotationSpeed;

        // Fade near the end or if falling off screen
        if (p.speedY > 0) {
          p.opacity -= 0.015;
        }

        // Draw particle
        if (p.opacity <= 0 || p.y > canvas.height) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'triangle') {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // square
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (particlesRef.current.length > 0) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [triggerId]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-50 rounded-2xl"
    />
  );
};
