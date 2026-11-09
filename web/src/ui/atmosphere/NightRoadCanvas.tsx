import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../motion/motion";
import { useTheme } from "../../context/ThemeContext";

interface NightRoadCanvasProps {
  className?: string;
  intensity?: number; // 0.0 to 1.0 (e.g. 0.35 for app backdrop, 0.85 for landing hero)
  showBokeh?: boolean;
}

interface BokehParticle {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
  alpha: number;
}

/**
 * Background Engine (SPEC v12 B1/B2/B5): "Night Highway / Morning India"
 * - Layer 1: Deep horizon gradient
 * - Layer 2: Perspective road plane with moving dashed center line
 * - Layer 3: Distant headlight bokeh particles (amber and teal)
 * - Layer 4: Primary horizon glow
 * Auto-pauses when hidden; degrades to static gradient on reduced motion.
 */
export const NightRoadCanvas: React.FC<NightRoadCanvasProps> = ({
  className = "",
  intensity = 0.4,
  showBokeh = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isReduced = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Check hardware low-power mode
  const [isLowPower] = useState(() => {
    if (typeof navigator === "undefined") return false;
    const cores = navigator.hardwareConcurrency || 8;
    return cores <= 2;
  });

  useEffect(() => {
    if (isReduced || isLowPower) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;
    const fpsInterval = 1000 / 30; // Cap at 30 fps for low CPU usage (<5%)
    let offset = 0;

    // Handle resizing
    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize bokeh particles
    const bokehColors = isDark
      ? ["#FFB020", "#19D3C5", "#FFC24D", "#38BDF8"]
      : ["#F59E0B", "#0D9488", "#6366F1"];

    const particles: BokehParticle[] = [];
    if (showBokeh) {
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: window.innerHeight * 0.35 + (Math.random() * 0.15 - 0.075) * window.innerHeight,
          radius: 12 + Math.random() * 24,
          color: bokehColors[i % bokehColors.length],
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.05,
          alpha: 0.04 + Math.random() * 0.06,
        });
      }
    }

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);

      // Pause if tab is hidden
      if (document.hidden) return;

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = currentTime - (elapsed % fpsInterval);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Horizon line
      const horizonY = h * 0.42;

      // Layer 4: Horizon Glow
      const glow = ctx.createRadialGradient(w * 0.5, horizonY, 10, w * 0.5, horizonY, w * 0.6);
      if (isDark) {
        glow.addColorStop(0, `rgba(255, 176, 32, ${0.08 * intensity})`);
        glow.addColorStop(0.5, `rgba(25, 211, 197, ${0.03 * intensity})`);
        glow.addColorStop(1, "rgba(7, 11, 20, 0)");
      } else {
        glow.addColorStop(0, `rgba(245, 158, 11, ${0.1 * intensity})`);
        glow.addColorStop(1, "rgba(255, 249, 240, 0)");
      }
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Layer 3: Headlight Bokeh
      if (showBokeh) {
        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < -50) p.x = w + 50;
          if (p.x > w + 50) p.x = -50;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.save();
          ctx.globalAlpha = p.alpha * intensity;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Layer 2: Perspective Road Plane
      const vanishingX = w * 0.5;
      const roadTopWidth = w * 0.12;
      const roadBottomWidth = w * 0.95;

      const roadLeftTop = vanishingX - roadTopWidth * 0.5;
      const roadRightTop = vanishingX + roadTopWidth * 0.5;
      const roadLeftBottom = vanishingX - roadBottomWidth * 0.5;
      const roadRightBottom = vanishingX + roadBottomWidth * 0.5;

      // Road asphalt surface
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(roadLeftTop, horizonY);
      ctx.lineTo(roadRightTop, horizonY);
      ctx.lineTo(roadRightBottom, h);
      ctx.lineTo(roadLeftBottom, h);
      ctx.closePath();

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      if (isDark) {
        roadGrad.addColorStop(0, `rgba(12, 18, 32, ${0.12 * intensity})`);
        roadGrad.addColorStop(1, `rgba(17, 26, 44, ${0.28 * intensity})`);
      } else {
        roadGrad.addColorStop(0, `rgba(235, 226, 212, ${0.15 * intensity})`);
        roadGrad.addColorStop(1, `rgba(216, 204, 184, ${0.3 * intensity})`);
      }
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road edge lines
      ctx.strokeStyle = isDark
        ? `rgba(255, 176, 32, ${0.18 * intensity})`
        : `rgba(55, 48, 163, ${0.18 * intensity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roadLeftTop, horizonY);
      ctx.lineTo(roadLeftBottom, h);
      ctx.moveTo(roadRightTop, horizonY);
      ctx.lineTo(roadRightBottom, h);
      ctx.stroke();

      // Moving dashed center line
      offset = (offset + 0.0035) % 1; // Speed 0.15x
      const numDashes = 10;
      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${0.22 * intensity})`
        : `rgba(245, 158, 11, ${0.28 * intensity})`;

      for (let i = 0; i < numDashes; i++) {
        // Perspective distribution using quadratic interpolation
        const t1 = ((i + offset) / numDashes) % 1;
        const t2 = Math.min(1, t1 + 0.04);
        if (t1 > 0.02) {
          const p1 = Math.pow(t1, 2.2);
          const p2 = Math.pow(t2, 2.2);

          const y1 = horizonY + (h - horizonY) * p1;
          const y2 = horizonY + (h - horizonY) * p2;
          const width1 = 1 + p1 * 5;

          ctx.lineWidth = width1;
          ctx.beginPath();
          ctx.moveTo(vanishingX, y1);
          ctx.lineTo(vanishingX, y2);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isReduced, isLowPower, intensity, isDark, showBokeh]);

  // Degraded fallback for reduced motion or low-power mode
  if (isReduced || isLowPower) {
    return (
      <div
        className={`fixed inset-0 pointer-events-none -z-20 transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-b from-[#070B14] via-[#0C1220] to-[#070B14]"
            : "bg-gradient-to-b from-[#FFF9F0] via-[#FDF5E8] to-[#EAF3FF]"
        } ${className}`}
      />
    );
  }

  return (
    <div className={`fixed inset-0 pointer-events-none -z-20 overflow-hidden ${className}`}>
      {/* Deep gradient base */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-b from-[#070B14] via-[#0C1220]/90 to-[#070B14]"
            : "bg-gradient-to-b from-[#FFF9F0] via-[#FFF9F0] to-[#EAF3FF]"
        }`}
      />
      {/* 2D Canvas Road Animation */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/30 pointer-events-none" />
    </div>
  );
};

