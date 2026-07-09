import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

/**
 * Animated node-network background using pure Canvas.
 * Fast, lightweight, no external dependency needed.
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
      const density = Math.max(28, Math.floor((width * height) / 22000));
      for (let i = 0; i < density; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6,
          hot: Math.random() > 0.85,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const alpha = (1 - d / 140) * 0.35;
            ctx.strokeStyle =
              a.hot || b.hot
                ? `rgba(167, 139, 250, ${alpha})`
                : `rgba(255, 255, 255, ${alpha * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.hot ? "#a78bfa" : "rgba(255,255,255,0.5)";
        ctx.fill();

        if (n.hot) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(167,139,250,0.4)";
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
      className="relative overflow-hidden bg-[#0b0616] text-[#fdfbff] py-28 md:py-40 noise"
    >
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0">
        <NodeNetwork />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0616]/40 to-[#0b0616]" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <span className="chip chip-dark" data-testid="engine-eyebrow">
              <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" strokeWidth={1.75} />
              The AI Trust Graph
            </span>
            <h2
              data-testid="engine-headline"
              className="mt-6 font-display text-[40px] sm:text-[56px] lg:text-[76px] leading-[1.02] font-semibold tracking-tight"
            >
              An engine that learns
              <br />
              <span className="text-violet-shine">which trust</span> actually
              converts.
            </h2>
            <p className="mt-8 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-white/70">
              Uplaud ingests every WhatsApp review, comment and referral, tags
              them by story, context and intent, and maps the clusters that
              convert for your business. Then it feeds high-signal audiences
              and creative back into your ad accounts, so every dollar rides on
              warm data instead of cold guesses.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 self-end">
            <StatCard
              testId="engine-stat-signals"
              label="signals ingested"
              value="7.4M"
              foot="reviews · replies · shares"
            />
            <StatCard
              testId="engine-stat-clusters"
              label="trust clusters"
              value="1,284"
              foot="mapped to buyer intent"
            />
            <StatCard
              testId="engine-stat-lift"
              label="creative lift"
              value="+2.6x"
              foot="story-driven vs. generic"
              highlight
            />
            <StatCard
              testId="engine-stat-cac"
              label="paid CAC efficiency"
              value="+75%"
              foot="on pilot accounts"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ testId, label, value, foot, highlight }) {
  return (
    <div
      data-testid={testId}
      className={`relative overflow-hidden border rounded-2xl p-5 backdrop-blur-md ${
        highlight
          ? "border-[#7c3aed]/50 bg-[#7c3aed]/[0.08]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {highlight && <div className="beam" />}
      <div className="section-label section-label-dark">{label}</div>
      <div
        className={`mt-3 font-display text-[36px] leading-none tracking-tight font-semibold ${
          highlight ? "text-violet-shine" : "text-[#fdfbff]"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] text-white/55">{foot}</div>
    </div>
  );
}
