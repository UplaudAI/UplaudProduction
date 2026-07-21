import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Lock, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { setAuth, getAuth, getImported } from "@/lib/business-storage";

const LOGO_URL =
  "https://customer-assets-gfyr7b9c.emergentagent.net/job_ai-acquisition-hub-2/artifacts/24zfs0md_logo_white_background.webp";

export default function BusinessLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("alex@payrewards.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAuth()) {
      nav(getImported() ? "/business/insights" : "/business/import", { replace: true });
    }
  }, [nav]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setAuth({ email, name: "Alex Morgan", workspace: "PayRewards" });
      const dest = getImported() ? "/business/insights" : "/business/import";
      nav(dest, { replace: true });
    }, 600);
  };

  return (
    <div
      data-testid="business-login-page"
      className="min-h-screen w-full bg-white grid grid-cols-1 lg:grid-cols-2"
    >
      {/* Left — form */}
      <div className="flex flex-col justify-between p-8 md:p-14">
        <a
          href="/"
          data-testid="login-brand-logo"
          className="inline-flex items-center"
        >
          <img
            src={LOGO_URL}
            alt="Uplaud"
            className="h-10 w-auto object-contain mix-blend-multiply"
            style={{ maxWidth: 120 }}
          />
        </a>

        <div className="max-w-[440px] w-full mx-auto lg:mx-0 lg:ml-4">
          <span className="chip mb-6" data-testid="login-eyebrow">
            <span className="dot" />
            Sign in to your workspace
          </span>
          <h1
            data-testid="login-headline"
            className="font-display text-[38px] md:text-[44px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            The operating system for{" "}
            <span className="text-[#6d46c6]">customer-led growth</span>.
          </h1>
          <p
            data-testid="login-subhead"
            className="mt-4 text-[15px] leading-relaxed text-[#4b5563]"
          >
            Activate every meaningful interaction — before and after purchase —
            into compounding business growth.
          </p>

          <form
            onSubmit={handleSubmit}
            data-testid="login-form"
            className="mt-10 space-y-5"
          >
            <div>
              <label className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                Work email
              </label>
              <div className="mt-2 relative">
                <Mail className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-full border border-[#d9d1ee] bg-white text-[14px] text-[#111827] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#ece5f4] transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                Password
              </label>
              <div className="mt-2 relative">
                <Lock className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-full border border-[#d9d1ee] bg-white text-[14px] text-[#111827] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#ece5f4] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p
                data-testid="login-error"
                className="text-[13px] text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="btn-primary w-full justify-center h-12"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />}
            </button>

            <div className="flex items-center justify-between text-[12.5px] text-[#4b5563]">
              <a
                href="#"
                data-testid="login-forgot-link"
                className="hover:text-[#6d46c6] transition-colors"
              >
                Forgot password?
              </a>
              <span className="flex items-center gap-1.5 text-[#9ca3af]">
                <ShieldCheck className="w-3.5 h-3.5" />
                SOC 2 &nbsp;·&nbsp; SSO ready
              </span>
            </div>
          </form>

          <p className="mt-8 text-[13px] text-[#4b5563]">
            New to Uplaud?{" "}
            <a
              href="/#demo"
              className="text-[#6d46c6] hover:underline"
              data-testid="login-book-demo-link"
            >
              Book a demo
            </a>
          </p>
        </div>

        <p className="text-[11.5px] text-[#9ca3af] mt-10">
          © 2026 Uplaud AI. All rights reserved.
        </p>
      </div>

      {/* Right — dark brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#261c4d] text-white p-14 flex-col justify-between noise">
        <div
          aria-hidden
          className="absolute inset-0 grid-bg opacity-40"
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(109,70,198,0.4), transparent 60%)",
          }}
        />

        <div className="relative">
          <span className="chip chip-dark">
            <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
            Uplaud · Growth Engine
          </span>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 text-[11px] font-mono text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#5eead4]" />
              Growth Engine · PayRewards
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Stat label="Prospects" value="388" />
              <Stat label="Warm intros" value="94" />
              <Stat label="New customers" value="21" />
            </div>
            <div className="mt-5 space-y-2">
              {[
                { label: "Demo → prospect", value: 60 },
                { label: "Testimonial approved", value: 44 },
                { label: "Warm intro delivered", value: 27 },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="text-[12px] w-28 text-white/60">{r.label}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5eead4]"
                      style={{ width: `${r.value}%` }}
                    />
                  </div>
                  <div className="text-[12px] font-mono w-8 text-right">
                    {r.value}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 font-display text-[26px] leading-[1.15] max-w-[420px]">
            <span className="mint-underline text-[#261c4d]">Every interaction</span>{" "}
            <span className="text-white/95">is a growth asset waiting to compound.</span>
          </p>
          <p className="mt-4 text-[13px] text-white/60 max-w-[400px]">
            Pre-customer to advocate. One continuous engine, sitting on top of
            your paid acquisition.
          </p>
        </div>

        <div className="relative text-[11px] font-mono text-white/40">
          BUILT FOR EDUCATION · HEALTHCARE · LEGAL · PET CARE · FINANCE · ECOMMERCE
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 font-mono">{label}</div>
      <div className="text-[22px] font-display font-semibold mt-0.5">{value}</div>
    </div>
  );
}
