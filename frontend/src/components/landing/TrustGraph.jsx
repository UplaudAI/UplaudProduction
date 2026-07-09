import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

/**
 * Lightweight node-network in Canvas — mint & lavender nodes on deep purple.
 */
function NodeNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const nodes = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const build = () => {
      resize();
      nodes.length = 0;
      const density = Math.max(24, Math.floor((width * height) / 25000));
      for (let i = 0; i < density; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.6,
          hot: Math.random() > 0.86,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            const alpha = (1 - d / 150) * 0.35;
            ctx.strokeStyle =
              a.hot || b.hot
                ? `rgba(94, 234, 212, ${alpha})`
                : `rgba(191, 167, 234, ${alpha * 0.55})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.hot ? "#5eead4" : "rgba(191,167,234,0.65)";
        ctx.fill();
        if (n.hot) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(94,234,212,0.4)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });
      raf = requestAnimationFrame(draw);
    };

    build();
    draw();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="trust-graph-canvas"
      className="absolute inset-0 w-full h-full"
    />
  );
}

export default function TrustGraph() {
  return (
    <section
      id="engine"
      data-testid="ai-engine-section"
      className="relative overflow-hidden bg-[#261c4d] text-white py-24 md:py-32 noise"
    >
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0">
        <NodeNetwork />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#261c4d]/40 to-[#261c4d] pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl">
          <span className="chip chip-dark" data-testid="engine-eyebrow">
            <Sparkles
              className="w-3.5 h-3.5 text-[#5eead4]"
              strokeWidth={1.75}
            />
            Powered by AI
          </span>
          <h2
            data-testid="engine-headline"
            className="mt-6 font-display text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.02] font-semibold tracking-tight"
          >
            AI that knows{" "}
            <span className="text-[#5eead4]">what your best customers</span>{" "}
            love &mdash; and finds you more of them.
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/70">
            Uplaud reads every review, spots the stories that convert, and
            quietly turns them into your best-performing ads and referrals. No
            dashboards to babysit. No jargon to learn.
          </p>
        </div>
      </div>
    </section>
  );
}
