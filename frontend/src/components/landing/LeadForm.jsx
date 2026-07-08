import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and work email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/leads`, form);
      setSubmitted(true);
      toast.success(res.data?.message || "Thanks — we'll be in touch.");
    } catch (err) {
      const msg =
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="demo"
      data-testid="lead-form-section"
      className="relative py-24 md:py-32 bg-[#050505] text-[#fdfdfb] noise overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-[#10b981]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <span className="chip chip-dark">
              <span className="dot" />
              Now onboarding pilot customers
            </span>
            <h2
              data-testid="demo-headline"
              className="mt-6 font-display text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.02] font-medium tracking-tight"
            >
              Build your Trust Graph.
              <br />
              <span className="text-[#10b981]">Lower your CAC.</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-white/65 max-w-md">
              Tell us a little about your business. We&apos;ll come back with a
              tailored walkthrough — including where the biggest CAC wins are
              hiding for you.
            </p>

            <div className="mt-10 space-y-4 text-[13px] text-white/60">
              <Row label="Reply time">Under 24 hours, from the founder.</Row>
              <Row label="Pilot length">4 – 6 weeks, one core loop live.</Row>
              <Row label="Data required">Read-only reviews + ad accounts.</Row>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submitted ? (
              <div
                data-testid="lead-form-success"
                className="border border-[#10b981]/40 bg-[#10b981]/[0.06] rounded-sm p-10 flex flex-col items-start gap-4"
              >
                <CheckCircle2
                  className="w-8 h-8 text-[#10b981]"
                  strokeWidth={1.5}
                />
                <h3 className="font-display text-[28px] tracking-tight">
                  Thanks — we&apos;re on it.
                </h3>
                <p className="text-[14px] text-white/70 max-w-md">
                  Your request landed with Deepthi and the team. Expect a note
                  from us within a day, from a real inbox — not a sequence.
                </p>
              </div>
            ) : (
              <form
                data-testid="lead-form"
                onSubmit={onSubmit}
                className="border border-white/10 rounded-sm p-6 md:p-8 bg-white/[0.03] backdrop-blur-md"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Your name"
                    testId="lead-name-input"
                    value={form.name}
                    onChange={update("name")}
                    required
                  />
                  <Field
                    label="Work email"
                    type="email"
                    testId="lead-email-input"
                    value={form.email}
                    onChange={update("email")}
                    required
                  />
                  <Field
                    label="Company"
                    testId="lead-company-input"
                    value={form.company}
                    onChange={update("company")}
                  />
                  <Field
                    label="Website"
                    testId="lead-website-input"
                    placeholder="https://"
                    value={form.website}
                    onChange={update("website")}
                  />
                </div>

                <div className="mt-4">
                  <label className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                    What are you working on?
                  </label>
                  <textarea
                    data-testid="lead-message-input"
                    value={form.message}
                    onChange={update("message")}
                    rows={4}
                    placeholder="What you sell, current CAC pain, biggest growth question…"
                    className="mt-2 w-full bg-transparent border border-white/15 rounded-sm px-3 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-[#10b981] focus:outline-none transition-colors"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-white/40 max-w-xs">
                    By submitting, you agree to be contacted about Uplaud. We
                    don&apos;t share your data.
                  </p>
                  <button
                    type="submit"
                    data-testid="lead-form-submit"
                    disabled={submitting}
                    className="btn-primary btn-on-dark disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Book a demo
                        <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, testId, type = "text", ...rest }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-widest text-white/50">
        {label}
      </span>
      <input
        type={type}
        data-testid={testId}
        {...rest}
        className="mt-2 w-full bg-transparent border border-white/15 rounded-sm px-3 py-3 text-[14px] text-white placeholder:text-white/30 focus:border-[#10b981] focus:outline-none transition-colors"
      />
    </label>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/5 pb-3">
      <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
        {label}
      </span>
      <span className="text-right max-w-xs">{children}</span>
    </div>
  );
}
