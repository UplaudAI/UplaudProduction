import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updatePassword } from "@/lib/password-reset";

const LOGO_URL =
  "https://customer-assets-gfyr7b9c.emergentagent.net/job_ai-acquisition-hub-2/artifacts/24zfs0md_logo_white_background.webp";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(supabase, password);
      setSuccess("Password updated. You can now sign in with your new password.");
      await supabase.auth.signOut();
      setTimeout(() => nav("/business", { replace: true }), 1200);
    } catch (err) {
      setError(err.message || "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="reset-password-page"
      className="min-h-screen w-full bg-white grid grid-cols-1 lg:grid-cols-2"
    >
      <div className="flex flex-col justify-between p-8 md:p-14">
        <a href="/" className="inline-flex items-center">
          <img
            src={LOGO_URL}
            alt="Uplaud"
            className="h-10 w-auto object-contain mix-blend-multiply"
            style={{ maxWidth: 120 }}
          />
        </a>

        <div className="max-w-[440px] w-full mx-auto lg:mx-0 lg:ml-4">
          <span className="chip mb-6">
            <span className="dot" />
            Reset your password
          </span>
          <h1 className="font-display text-[38px] md:text-[44px] leading-[1.02] font-semibold tracking-tight text-[#111827]">
            Create a new password.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4b5563]">
            Use the password reset link from your email, then choose a new password for your workspace.
          </p>

          {checkingSession ? (
            <p className="mt-10 text-[13px] text-[#4b5563]">Checking reset link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              {!hasSession && (
                <p className="text-[13px] text-amber-700 font-medium bg-amber-50 p-3 rounded-xl border border-amber-100">
                  This reset link is missing or expired. Request a new password reset email.
                </p>
              )}

              <div>
                <label className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                  New password
                </label>
                <div className="mt-2 relative">
                  <Lock className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="reset-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-full border border-[#d9d1ee] bg-white text-[14px] text-[#111827] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#ece5f4] transition-all"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                  Confirm password
                </label>
                <div className="mt-2 relative">
                  <Lock className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="reset-password-confirm-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-full border border-[#d9d1ee] bg-white text-[14px] text-[#111827] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#ece5f4] transition-all"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </p>
              )}

              {success && (
                <p className="text-[13px] text-green-600 font-medium bg-green-50 p-3 rounded-xl border border-green-100">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !hasSession}
                data-testid="reset-password-submit-btn"
                className="btn-primary w-full justify-center h-12 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
                {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />}
              </button>

              <button
                type="button"
                onClick={() => nav("/business")}
                className="text-[12.5px] font-medium text-[#6d46c6] hover:underline"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="text-[11.5px] text-[#9ca3af] mt-10">
          © 2026 Uplaud AI. All rights reserved.
        </p>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-[#261c4d] text-white p-14 flex-col justify-between noise">
        <div aria-hidden className="absolute inset-0 grid-bg opacity-40" />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)" }}
        />
        <div className="relative">
          <span className="chip chip-dark">
            <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
            Secure recovery
          </span>
        </div>
        <div className="relative">
          <p className="font-display text-[34px] leading-[1.1] max-w-[480px]">
            Password resets are handled through Supabase Auth and expire automatically.
          </p>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 max-w-[420px]">
            Open the newest reset email, set a fresh password, then sign in again.
          </p>
        </div>
        <div className="relative text-[11px] font-mono text-white/40">
          UPLAUD · BUSINESS WORKSPACE ACCESS
        </div>
      </div>
    </div>
  );
}
