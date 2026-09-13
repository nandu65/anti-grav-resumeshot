import { useEffect, useState } from "react";

/**
 * GlobalCursorSpotlight
 * Tracks cursor position across the entire viewport and casts a compact, focused
 * spotlight glow. In Light Mode, it renders a darker, higher-contrast emerald tint.
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
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;
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
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Dark Mode Core Radiant Beam */}
      <div
        className="hidden dark:block absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[45px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "240px",
          height: "240px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(20, 184, 166, 0.06) 50%, transparent 80%)",
        }}
      />
      {/* Dark Mode Outer Ring */}
      <div
        className="hidden dark:block absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "360px",
          height: "360px",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.02) 60%, transparent 85%)",
        }}
      />

      {/* Light Mode: Darker, rich emerald-contrast focused spotlight */}
      <div
        className="block dark:hidden absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[40px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "220px",
          height: "220px",
          background:
            "radial-gradient(circle, rgba(5, 150, 105, 0.22) 0%, rgba(15, 118, 110, 0.12) 50%, transparent 80%)",
        }}
      />
      <div
        className="block dark:hidden absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[55px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "340px",
          height: "340px",
          background:
            "radial-gradient(circle, rgba(15, 23, 42, 0.08) 0%, rgba(5, 150, 105, 0.06) 55%, transparent 85%)",
        }}
      />
    </div>
  );
}
