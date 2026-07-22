import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const LOGIN_BG =
  "https://images.pexels.com/photos/37982071/pexels-photo-37982071.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/business/insights");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left: form */}
      <div className="flex flex-col justify-between px-8 py-10 sm:px-16 lg:px-20">
        <div className="flex items-center gap-2" data-testid="brand-logo">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-heading font-extrabold text-lg">
            U
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-slate-900">
            Uplaud <span className="text-slate-400 font-medium">· Growth Engine</span>
          </span>
        </div>

        <div className="max-w-sm w-full mx-auto py-12">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-600 mb-3">
            Sign in to your workspace
          </p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            The operating system for customer-led growth.
          </h1>
          <p className="text-slate-500 mt-4 text-sm leading-relaxed">
            Activate every meaningful interaction — before and after purchase — into compounding business growth.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="login-form">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">Work email</Label>
              <Input
                id="email"
                type="email"
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2" data-testid="login-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-transform hover:-translate-y-[1px] hover:shadow-md"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button type="button" className="hover:text-slate-600 transition-colors">Forgot password?</button>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> SOC 2 · SSO ready</span>
            </div>
          </form>
        </div>

        <p className="text-xs text-slate-400">© 2026 Uplaud AI. All rights reserved.</p>
      </div>

      {/* Right: image */}
      <div className="relative hidden lg:block">
        <img src={LOGIN_BG} alt="Architecture" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-indigo-950/70 mix-blend-multiply" />
        <div className="absolute inset-0 noise-overlay opacity-20" />
        <div className="relative h-full flex flex-col justify-end p-14 text-white">
          <h2 className="font-heading text-3xl font-bold tracking-tight max-w-md leading-tight">
            Every interaction is a growth asset waiting to compound.
          </h2>
          <p className="text-indigo-100/80 mt-4 max-w-md text-sm leading-relaxed">
            Pre-customer to advocate. One continuous engine, sitting on top of your paid acquisition.
          </p>
          <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-indigo-200/70">
            Built for Education · Healthcare · Legal · Pet Care · Finance · Ecommerce
          </p>
        </div>
      </div>
    </div>
  );
}
