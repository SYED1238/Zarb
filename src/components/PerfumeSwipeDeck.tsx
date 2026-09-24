import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
} from 'react';
import type { Product } from '../types/product';
import { PerfumeProductCard } from './PerfumeProductCard';
import { Sparkles } from 'lucide-react';

export interface PerfumeSwipeDeckRef {
  next: () => void;
  prev: () => void;
  goToIndex: (index: number) => void;
}

interface PerfumeSwipeDeckProps {
  products: Product[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onQuickView: (product: Product) => void;
  isAlabaster?: boolean;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

export const PerfumeSwipeDeck = forwardRef<PerfumeSwipeDeckRef, PerfumeSwipeDeckProps>(
  ({ products, activeIndex, onActiveIndexChange, onQuickView, isAlabaster = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
    });

    // Exit animation state when card is swiped away
    const [exitState, setExitState] = useState<{
      active: boolean;
      direction: 'down' | 'left' | 'right' | 'up';
      x: number;
      y: number;
      rotate: number;
    } | null>(null);

    // Track whether a tap or drag occurred to prevent accidental quickview trigger
    const movedRef = useRef(false);

    const total = products.length;

    // Trigger next card transition with swipe down / flick animation (matching reference video)
    const handleNext = useCallback(
      (direction: 'down' | 'left' | 'right' = 'down') => {
        if (total <= 1 || exitState?.active) return;

        let exitX = 0;
        let exitY = 440;
        let exitRot = 7;

        if (direction === 'left') {
          exitX = -380;
          exitY = 30;
          exitRot = -16;
        } else if (direction === 'right') {
          exitX = 380;
          exitY = 30;
          exitRot = 16;
        }

        setExitState({
          active: true,
          direction,
          x: exitX,
          y: exitY,
          rotate: exitRot,
        });

        // Trigger light haptic feedback if supported
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // Ignore if vibration is restricted
          }
        }

        setTimeout(() => {
          onActiveIndexChange((activeIndex + 1) % total);
          setExitState(null);
        }, 260);
      },
      [total, exitState, activeIndex, onActiveIndexChange]
    );

    // Trigger prev card transition
    const handlePrev = useCallback(() => {
      if (total <= 1 || exitState?.active) return;
      const prevIndex = (activeIndex - 1 + total) % total;
      onActiveIndexChange(prevIndex);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          // Ignore
        }
      }
    }, [total, exitState, activeIndex, onActiveIndexChange]);

    const handleGoToIndex = useCallback(
      (index: number) => {
        if (index >= 0 && index < total && index !== activeIndex) {
          onActiveIndexChange(index);
        }
      },
      [total, activeIndex, onActiveIndexChange]
    );

    // Expose methods via ref for parent section controls
    useImperativeHandle(
      ref,
      () => ({
        next: () => handleNext('down'),
        prev: handlePrev,
        goToIndex: handleGoToIndex,
      }),
      [handleNext, handlePrev, handleGoToIndex]
    );

    // Reset exit state if products change
    useEffect(() => {
      setExitState(null);
    }, [products]);

    // Handle Pointer Down on Top Card
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't drag if user pressed an interactive element (button, link, input)
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.no-drag')
      ) {
        return;
      }

      // Only left clicks / single touches
      if (e.button !== 0) return;

      movedRef.current = false;
      const startX = e.clientX;
      const startY = e.clientY;

      setDragState({
        isDragging: true,
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        startTime: Date.now(),
      });

      // Capture pointer so moving fast doesn't lose tracking
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    // Handle Pointer Move on Top Card
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging || exitState?.active) return;

      const currentX = e.clientX;
      const currentY = e.clientY;
      const deltaX = currentX - dragState.startX;
      const deltaY = currentY - dragState.startY;

      // Mark moved if moved more than 6px
      if (Math.hypot(deltaX, deltaY) > 6) {
        movedRef.current = true;
      }

      setDragState((prev) => ({
        ...prev,
        currentX,
        currentY,
      }));
    };

    // Handle Pointer Up / Cancel
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging) return;

      try {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe catch
      }

      const deltaX = dragState.currentX - dragState.startX;
      const deltaY = dragState.currentY - dragState.startY;
      const deltaTime = Math.max(1, Date.now() - dragState.startTime);
      const velocityX = deltaX / deltaTime;
      const velocityY = deltaY / deltaTime;

      setDragState((prev) => ({ ...prev, isDragging: false }));

      // If user merely tapped without moving
      if (!movedRef.current && Math.hypot(deltaX, deltaY) < 8) {
        const topProduct = products[activeIndex];
        if (topProduct && onQuickView) {
          onQuickView(topProduct);
        }
        return;
      }

      // Check for swipe gesture thresholds:
      // 1. Swipe Down (Matching reference video_bfe9feaf74a2.mp4)
      if (deltaY > 55 || (deltaY > 25 && velocityY > 0.35)) {
        handleNext('down');
        return;
      }

      // 2. Swipe Left
      if (deltaX < -55 || (deltaX < -25 && velocityX < -0.35)) {
        handleNext('left');
        return;
      }

      // 3. Swipe Right
      if (deltaX > 55 || (deltaX > 25 && velocityX > 0.35)) {
        handleNext('right');
        return;
      }

      // 4. Swipe Up
      if (deltaY < -65 || (deltaY < -25 && velocityY < -0.35)) {
        handleNext('down');
        return;
      }
    };

    if (total === 0) return null;

    // Calculate active drag offsets
    const deltaX = dragState.isDragging ? dragState.currentX - dragState.startX : 0;
    const deltaY = dragState.isDragging ? dragState.currentY - dragState.startY : 0;
    const dragRotate = deltaX * 0.07 + (deltaY > 0 ? (deltaX >= 0 ? 3.5 : -3.5) * (deltaY / 150) : 0);
    const dragProgress = Math.min(1, Math.hypot(deltaX, deltaY) / 130);

    // Cards to show in stack (up to 4 cards: active + 3 behind)
    const stackCards = [];
    const maxVisibleBehind = Math.min(3, total - 1);

    for (let offset = 0; offset <= maxVisibleBehind; offset++) {
      const productIndex = (activeIndex + offset) % total;
      const product = products[productIndex];
      stackCards.push({ product, offset, productIndex });
    }

    return (
      <div
        ref={containerRef}
        className="relative w-full flex flex-col items-center select-none pt-1 pb-3 px-3"
        style={{ perspective: '1100px' }}
      >
        {/* Subtle Ambient Radial Lighting for Stack */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-amber-400/[0.07] blur-[80px] rounded-full pointer-events-none" />

        {/* ---------------- Swipe Stack Cards Container ---------------- */}
        <div
          className="relative w-full max-w-[315px] xs:max-w-[330px] h-[480px] xs:h-[505px] flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {stackCards
            .slice()
            .reverse()
            .map(({ product, offset, productIndex }) => {
              const isTop = offset === 0;

              // Compute stacked layer transform styles matching video_bfe9feaf74a2.mp4
              let transform = '';
              let opacity = 1;
              let zIndex = 30 - offset * 10;
              let filter = 'none';
              let pointerEvents: 'auto' | 'none' = isTop ? 'auto' : 'none';

              if (isTop) {
                if (exitState?.active) {
                  // Exit animation in motion (flying down/away matching video)
                  transform = `translate3d(${exitState.x}px, ${exitState.y}px, 0) rotate(${exitState.rotate}deg) scale(0.96)`;
                  opacity = 0;
                  pointerEvents = 'none';
                } else if (dragState.isDragging) {
                  // Live dragging top card
                  transform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(${dragRotate}deg) scale(${
                    1 - dragProgress * 0.03
                  })`;
                  opacity = 1 - dragProgress * 0.25;
                } else {
                  // Resting top card
                  transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
                  opacity = 1;
                }
              } else {
                // Stack cards behind fan out with alternating rotation angles matching reference video
                const baseAngles = [0, 5.5, -6.0, 3.5];
                const baseXs = [0, 5, -6, 4];
                const baseYs = [0, 10, 20, 28];
                const baseScales = [1, 0.94, 0.88, 0.83];
                const baseOpacities = [1, 0.92, 0.75, 0.5];
                const baseBrightness = [1, 0.93, 0.84, 0.75];

                const currentAngle = baseAngles[offset] || 0;
                const nextAngle = baseAngles[offset - 1] || 0;
                const currentX = baseXs[offset] || 0;
                const nextX = baseXs[offset - 1] || 0;
                const currentScale = baseScales[offset] || 0.85;
                const nextScale = baseScales[offset - 1] || 0.92;
                const currentY = baseYs[offset] || 20;
                const nextY = baseYs[offset - 1] || 10;
                const currentOp = baseOpacities[offset] || 0.7;
                const nextOp = baseOpacities[offset - 1] || 0.9;
                const currentBr = baseBrightness[offset] || 0.85;
                const nextBr = baseBrightness[offset - 1] || 0.95;

                // Interpolate forward when user drags top card
                const interpAngle = currentAngle + (nextAngle - currentAngle) * dragProgress;
                const interpX = currentX + (nextX - currentX) * dragProgress;
                const interpScale = currentScale + (nextScale - currentScale) * dragProgress;
                const interpY = currentY + (nextY - currentY) * dragProgress;
                const interpOp = currentOp + (nextOp - currentOp) * dragProgress;
                const interpBr = currentBr + (nextBr - currentBr) * dragProgress;

                transform = `translate3d(${interpX}px, ${interpY}px, -${offset * 25}px) rotate(${interpAngle}deg) scale(${interpScale})`;
                opacity = interpOp;
                filter = `brightness(${interpBr})`;
                zIndex = 30 - offset * 10;

                // Clicking the peeked card behind will bring it directly to front
                pointerEvents = offset === 1 && !dragState.isDragging ? 'auto' : 'none';
              }

              return (
                <div
                  key={product.id}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                  onClick={
                    offset === 1 && !dragState.isDragging
                      ? () => handleGoToIndex(productIndex)
                      : undefined
                  }
                  className={`absolute inset-0 flex flex-col justify-start touch-none will-change-transform ${
                    isTop ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  }`}
                  style={{
                    transform,
                    opacity,
                    filter,
                    zIndex,
                    pointerEvents,
                    transition:
                      dragState.isDragging && isTop
                        ? 'none'
                        : exitState?.active
                        ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease-out'
                        : 'transform 0.38s cubic-bezier(0.34, 1.35, 0.64, 1), opacity 0.3s ease, filter 0.3s ease',
                  }}
                >
                  <PerfumeProductCard
                    product={product}
                    onQuickView={onQuickView}
                    isStandalone={true}
                    disableHoverTransform={true}
                  />
                </div>
              );
            })}
        </div>

        {/* ---------------- Swipe Down / Flick Hint & Dots Bar ---------------- */}
        <div className="flex flex-col items-center mt-3 space-y-2">
          {/* Micro Gesture Hint Pill matching video */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider backdrop-blur-md border ${
              isAlabaster
                ? 'bg-amber-100/60 border-amber-300/60 text-[#7a5b28]'
                : 'bg-white/5 border-amber-400/20 text-[#dfb56c]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#c59450] animate-pulse" />
            <span>Flick Down to Reveal Next</span>
          </div>

          {/* Pagination Stack Dots */}
          <div className="flex items-center justify-center space-x-1.5 pt-0.5">
            {products.map((p, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Go to perfume ${p.name}`}
                  onClick={() => handleGoToIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-6 h-1.5 bg-[#c59450]'
                      : isAlabaster
                      ? 'w-1.5 h-1.5 bg-[#cfc2af] hover:bg-[#a89680]'
                      : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

PerfumeSwipeDeck.displayName = 'PerfumeSwipeDeck';
export default PerfumeSwipeDeck;
