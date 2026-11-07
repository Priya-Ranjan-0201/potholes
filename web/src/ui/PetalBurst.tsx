import React, { useEffect, useRef } from "react";
import { isReducedMotion } from "./motion";

interface PetalBurstProps {
  active: boolean;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  shape: "petal" | "powder";
  opacity: number;
}

export const PetalBurst: React.FC<PetalBurstProps> = ({
  active,
  onComplete,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    if (isReducedMotion()) {
      if (onComplete) onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Authentic Marigold, Gulal & Saffron celebration palette
    const colors = ["#FFB300", "#FF8A00", "#FF3D81", "#E8452C", "#FFE066", "#7ED321"];
    const particles: Particle[] = [];
    const count = 75; // <= 80 per spec

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: width / 2,
        y: height / 2 - 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // slight upward impulse
        size: 5 + Math.random() * 7,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.4 ? "petal" : "powder",
        opacity: 1,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 950; // < 1s per spec

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - progress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === "petal") {
          // Curved marigold petal shape
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Soft circular powder fleck
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
    />
  );
};

