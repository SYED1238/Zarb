import React, { useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface HolographicBeamsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Density of the light pillars.
   * Default: 45 (matches user preset)
   */
  density?: number;
  /**
   * Speed of the animation.
   * Default: 3.9 (matches user preset)
   */
  speed?: number;
  /**
   * Intensity of the chromatic aberration (RGB shift in px).
   * Default: 10.0 (matches user preset)
   */
  aberration?: number;
  /**
   * Base color weight / core opacity percentage.
   * Default: 50 (matches user preset)
   */
  opacity?: number;
  /**
   * Whether to render in Alabaster (warm ivory) light mode.
   */
  isAlabaster?: boolean;
}

export const HolographicBeams: React.FC<HolographicBeamsProps> = ({
  className,
  density = 45,
  speed = 3.9,
  aberration = 10.0,
  opacity = 50,
  isAlabaster,
  style,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  let storeTheme: string | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const store = useStore();
    storeTheme = store?.theme;
  } catch {
    storeTheme = undefined;
  }

  const effectiveAlabaster = isAlabaster ?? (storeTheme === 'alabaster');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // --- LOW-END DEVICE DETECTION ---
    const nav = navigator as any;
    const deviceMemory = nav.deviceMemory || 8; // GB, defaults to 8 if API unavailable
    const hardwareConcurrency = nav.hardwareConcurrency || 4;
    const isLowEnd = deviceMemory <= 4 || hardwareConcurrency <= 2;
    const isMidRange = deviceMemory <= 6 || hardwareConcurrency <= 4;

    // Skip canvas animation entirely on very low-end devices (≤4GB RAM)
    if (isLowEnd) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.offsetWidth || 1200;
    let height = container.offsetHeight || 500;
    let time = 0;
    let animationFrameId: number;
    let isVisible = true;
    let lastFrameTime = 0;

    // Throttle FPS: 20fps on mid-range mobile, 30fps on decent mobile, 60fps on desktop
    const isMobileScreen = window.innerWidth < 768;
    const targetFps = isMidRange ? 20 : isMobileScreen ? 30 : 60;
    const frameInterval = 1000 / targetFps;

    // --- VISIBILITY OBSERVER: pause when footer is off-screen ---
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    }

    // --- NOISE GENERATOR (Sine Superposition from new-main) ---
    const noise = (x: number, t: number) => {
      return (
        Math.sin(x * 0.01 + t) +
        Math.sin(x * 0.03 + t * 2) * 0.5 +
        Math.sin(x * 0.1 + t * 4) * 0.25
      ) / 1.75;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width) || container.offsetWidth || window.innerWidth;
      height = Math.floor(rect.height) || container.offsetHeight || 500;
      canvas.width = width;
      canvas.height = height;
    };

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);

      // Skip if not visible (off-screen) — huge perf win
      if (!isVisible) return;

      // Frame throttle
      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;

      // Reduce density further on mid-range devices
      const densityScale = isMidRange ? 0.5 : 1;
      const effectiveDensity = isMobile
        ? Math.max(10, Math.min(16, Math.floor(width / 25)))
        : Math.floor(density * densityScale);
      const effectiveAberration = isMobile ? Math.min(aberration, 8.0) : aberration;

      // Additive screen blending in noir, multiply in alabaster
      ctx.globalCompositeOperation = effectiveAlabaster ? 'multiply' : 'screen';

      time += 0.01 * speed;
      const beamWidth = width / effectiveDensity;

      // Mobile luminosity multiplier for punchy visibility
      const alphaBoost = isMobile ? 1.75 : 1.0;

      const drawBeam = (x: number, t: number, color: string, widthMod: number) => {
        const n = noise(x, t * 0.5);

        // Beam Geometry: on mobile, beams rise higher (85%-98% of height) to illuminate the compact footer
        const heightFactor = isMobile ? (0.85 + n * 0.15) : (0.42 + n * 0.2);
        const beamHeight = height * heightFactor;
        const currentBeamWidth = beamWidth * widthMod;

        const gradient = ctx.createLinearGradient(x, height, x, height - beamHeight);
        gradient.addColorStop(0, color); // Base at bottom
        gradient.addColorStop(0.35, color); // Maintain core visibility
        gradient.addColorStop(1, 'transparent'); // Tip fading out

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - currentBeamWidth / 2, height);
        ctx.lineTo(x + currentBeamWidth / 2, height);
        ctx.lineTo(x + currentBeamWidth * 1.1, height - beamHeight);
        ctx.lineTo(x - currentBeamWidth * 1.1, height - beamHeight);
        ctx.closePath();
        ctx.fill();
      };

      for (let i = 0; i <= effectiveDensity; i++) {
        const x = i * beamWidth;

        // 1. RED / MAGENTA CHANNEL (Shifted Left by aberration)
        const rAlpha = (opacity / 100) * (0.5 + 0.5 * Math.cos(i * 0.5 + time));
        drawBeam(
          x - effectiveAberration,
          time + i * 0.1,
          `rgba(255, 10, 45, ${Math.min(0.85, rAlpha * 0.5 * alphaBoost)})`,
          isMobile ? 1.8 : 1.5
        );

        // 2. BLUE / INDIGO CHANNEL (Shifted Right by aberration)
        const bAlpha = (opacity / 100) * (0.5 + 0.5 * Math.sin(i * 0.6 + time * 1.1));
        drawBeam(
          x + effectiveAberration,
          time + i * 0.12 + 10,
          `rgba(0, 95, 255, ${Math.min(0.85, bAlpha * 0.5 * alphaBoost)})`,
          isMobile ? 1.8 : 1.5
        );

        // 3. CYAN / WHITE CORE CHANNEL (Center Structure)
        const coreAlpha = (opacity / 100) * (0.6 + 0.4 * Math.sin(i * 0.3 - time));
        drawBeam(
          x,
          time + i * 0.1 + 5,
          `rgba(220, 255, 255, ${Math.min(0.75, coreAlpha * 0.32 * alphaBoost)})`,
          isMobile ? 1.0 : 0.8
        );
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    }

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (resizeObserver) resizeObserver.disconnect();
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, speed, aberration, opacity, effectiveAlabaster]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 w-full h-full overflow-hidden pointer-events-none',
        effectiveAlabaster ? 'bg-transparent' : 'bg-[#070709]',
        className
      )}
      style={style}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none block w-full h-full"
      />

      {/* Texture Overlay (Scanlines) matching new-main */}
      <div
        className={cn('absolute inset-0 pointer-events-none transition-opacity duration-300', effectiveAlabaster ? 'opacity-10' : 'opacity-30')}
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3) 100%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Calibrated Vignette Edge Falloff: keeps bottom beams bright & atmospheric */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: effectiveAlabaster
            ? 'radial-gradient(ellipse at 50% 95%, transparent 40%, rgba(236,232,223,0.3) 70%, rgba(236,232,223,0.9) 100%)'
            : 'radial-gradient(ellipse at 50% 95%, transparent 30%, rgba(7,7,9,0.3) 65%, rgba(7,7,9,0.85) 100%)',
        }}
      />
    </div>
  );
};

export default HolographicBeams;
