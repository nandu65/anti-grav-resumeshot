/**
 * Lightweight, zero-dependency Canvas Confetti Engine
 * Renders emerald and gold confetti particle bursts for score milestones.
 */
export function triggerConfetti(options?: {
  particleCount?: number;
  durationMs?: number;
  colors?: string[];
}) {
  if (typeof document === "undefined") return;

  const count = options?.particleCount ?? 65;
  const duration = options?.durationMs ?? 2500;
  const colors = options?.colors ?? [
    "#10B981", // Emerald
    "#34D399", // Mint
    "#059669", // Deep Emerald
    "#F59E0B", // Amber / Gold
    "#3B82F6", // Cyan / Blue
    "#FFFFFF", // Pure White
  ];

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    alpha: number;
  }

  const particles: Particle[] = [];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = 8 + Math.random() * 12;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 4,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 15,
      alpha: 1,
    });
  }

  const startTime = performance.now();

  const render = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.vx *= 0.98; // Drag
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - progress);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}
