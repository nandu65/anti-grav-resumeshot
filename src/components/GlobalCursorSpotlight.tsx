import { useEffect, useState } from "react";

/**
 * GlobalCursorSpotlight
 * Tracks cursor position across the entire viewport and casts a subtle, luxurious
 * radial spotlight glow that illuminates dark obsidian backgrounds.
 */
export function GlobalCursorSpotlight() {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Disable on touch-only devices
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let animationFrameId: number;
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    // Smooth lerp physics for cursor trailing glow
    const render = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setPos({ x: Math.round(currentX), y: Math.round(currentY) });
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Primary Emerald Core Beam */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "550px",
          height: "550px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.04) 45%, transparent 70%)",
        }}
      />
      {/* Secondary Cyan Soft Halo */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "800px",
          height: "800px",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.03) 0%, rgba(16, 185, 129, 0.015) 50%, transparent 80%)",
        }}
      />
    </div>
  );
}
