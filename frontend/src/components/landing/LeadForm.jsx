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
      toast.success(res.data?.message || "Thanks, we will be in touch.");
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
      className="relative py-24 md:py-32 bg-[#f5f3ff]"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 30%, rgba(94,234,212,0.28), transparent 70%), radial-gradient(60% 60% at 80% 70%, rgba(109,70,198,0.18), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <span className="chip">
              <span className="dot" />
              Now onboarding pilot customers
            </span>
            <h2
              data-testid="demo-headline"
              className="mt-6 font-display text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
            >
              See it in
              <br />
              <span className="mint-underline">your business.</span>
            </h2>
            <p className="mt-6 text-[15.5px] leading-relaxed text-[#4b5563] max-w-md">
              Tell us a little about what you do. We come back with a 20-min
              walkthrough tailored to your business.
            </p>

            <div className="mt-10 space-y-3 text-[13px] text-[#4b5563]">
              <Row label="Reply time">Under 24 hours, from the founder.</Row>
              <Row label="Setup">Live in 20 minutes.</Row>
              <Row label="Cost">Free pilot for the first cohort.</Row>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submitted ? (
              <div
                data-testid="lead-form-success"
                className="border-2 border-[#6d46c6] bg-white rounded-2xl p-10 flex flex-col items-start gap-4"
              >
                <CheckCircle2
                  className="w-9 h-9 text-[#6d46c6]"
                  strokeWidth={1.75}
                />
                <h3 className="font-display text-[28px] tracking-tight font-semibold text-[#111827]">
                  Thanks, we are on it.
                </h3>
                <p className="text-[14px] text-[#4b5563] max-w-md">
                  Your request landed with Deepthi and the team. Expect a note
                  from us within a day, from a real inbox.
                </p>
              </div>
            ) : (
              <form
                data-testid="lead-form"
                onSubmit={onSubmit}
                noValidate
                className="border border-[#eeeaf6] rounded-2xl p-6 md:p-8 bg-white shadow-[0_25px_60px_-30px_rgba(38,28,77,0.25)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Your name"
                    testId="lead-name-input"
                    value={form.name}
                    onChange={update("name")}
                  />
                  <Field
                    label="Work email"
                    type="email"
                    testId="lead-email-input"
                    value={form.email}
                    onChange={update("email")}
                  />
                  <Field
                    label="Business"
                    testId="lead-company-input"
                    placeholder="e.g. Bright Kids Preschool"
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
                  <label className="font-mono text-[11px] uppercase tracking-widest text-[#4b5563]">
                    What do you do? (optional)
                  </label>
                  <textarea
                    data-testid="lead-message-input"
                    value={form.message}
                    onChange={update("message")}
                    rows={4}
                    placeholder="Tell us about your business in one line..."
                    className="mt-2 w-full bg-white border border-[#eeeaf6] rounded-xl px-3 py-3 text-[14px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6d46c6] focus:outline-none transition-colors"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#9ca3af] max-w-xs">
                    By submitting you agree to be contacted about Uplaud. We
                    never share your data.
                  </p>
                  <button
                    type="submit"
                    data-testid="lead-form-submit"
                    disabled={submitting}
                    className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending
                      </>
                    ) : (
                      <>
                        Book my demo
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
      <span className="font-mono text-[11px] uppercase tracking-widest text-[#4b5563]">
        {label}
      </span>
      <input
        type={type}
        data-testid={testId}
        {...rest}
        className="mt-2 w-full bg-white border border-[#eeeaf6] rounded-xl px-3 py-3 text-[14px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6d46c6] focus:outline-none transition-colors"
      />
    </label>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-[#eeeaf6] pb-3">
      <span className="font-mono text-[11px] uppercase tracking-widest text-[#9ca3af]">
        {label}
      </span>
      <span className="text-right max-w-xs">{children}</span>
    </div>
  );
}
