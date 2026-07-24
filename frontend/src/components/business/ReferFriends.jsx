import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  X,
  ShieldCheck,
  Gift,
  Loader2,
  CheckCircle2,
  User,
  AtSign,
  Building2,
} from "lucide-react";
import api from "@/lib/api";
import { logEvent } from "@/lib/analytics";

const PURPLE = "#6d46c6";
const PURPLE_DEEP = "#261c4d";
const MINT = "#5eead4";

export default function ReferFriends({ shareId, brand = "PayRewards" }) {
  const [rows, setRows] = useState([{ name: "", contact: "", company: "" }]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const update = (i, field, val) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const addRow = () => { setRows((rs) => [...rs, { name: "", contact: "", company: "" }]); logEvent("refer_add_row_click", { page: "testimonial", shareId }); };
  const removeRow = (i) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
    logEvent("refer_remove_row_click", { page: "testimonial", shareId });
  };

  const submit = async () => {
    const valid = rows.filter((r) => r.name.trim() && r.contact.trim() && r.company.trim());
    if (!valid.length) {
      toast.error("Add a friend's name, contact, and company name");
      return;
    }
    setBusy(true);
    logEvent("refer_submit_click", { page: "testimonial", shareId });
    try {
      const res = await api.post(`/public/testimonial/${shareId}/referrals`, { referrals: valid });
      setDone(res.data?.count || valid.length);
      toast.success("Thank you for the intro!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not submit referrals");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-testid="refer-friends" className="rounded-2xl overflow-hidden border border-[#e6dff5] shadow-sm">
      {/* Header */}
      <div className="p-6 sm:p-7" style={{ background: `linear-gradient(120deg, ${PURPLE_DEEP}, ${PURPLE})` }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl" style={{ background: MINT, color: PURPLE_DEEP }}>
            <Gift className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">Help a friend</span>
        </div>
        <h2 className="mt-3 font-display text-[22px] sm:text-[26px] font-bold text-white leading-tight">
          Know someone who'd find {brand} useful?
        </h2>
        <p className="mt-2 text-[13.5px] text-white/70 max-w-[560px] leading-relaxed">
          Introduce a few people from your network. The {brand} team will reach out and share your testimonial with them.
          Their details are kept private and secure — never posted publicly.
        </p>
      </div>

      {/* Body */}
      <div className="bg-white p-6 sm:p-7">
        {done > 0 ? (
          <div data-testid="refer-success" className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "#eafaf4", color: "#0f9b7c" }}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="mt-4 font-display text-[19px] font-semibold text-[#261c4d]">
              Thank you! We'll reach out to {done} {done === 1 ? "friend" : "friends"}.
            </h3>
            <p className="mt-1.5 text-[13px] text-[#6b6480]">
              We'll be warm, helpful, and never spammy — and their info stays secure.
            </p>
            <button
              data-testid="refer-more-btn"
              onClick={() => { setRows([{ name: "", contact: "", company: "" }]); setDone(0); logEvent("refer_more_friends_click", { page: "testimonial", shareId }); }}
              className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-medium border border-[#e2d9f5] text-[#261c4d] hover:bg-[#f5f3ff]"
            >
              <Plus className="w-4 h-4" /> Refer more friends
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} data-testid={`refer-row-${i}`} className="rounded-xl border border-[#eee7f7] bg-[#faf9ff] p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b1a9c6]" />
                      <input
                        data-testid={`refer-name-${i}`}
                        value={r.name}
                        onChange={(e) => update(i, "name", e.target.value)}
                        placeholder="Friend's name"
                        className="w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-[#eee7f7] text-[14px] text-[#261c4d] placeholder:text-[#b1a9c6] focus:outline-none focus:border-[#6d46c6]"
                      />
                    </div>
                    <div className="relative flex-1">
                      <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b1a9c6]" />
                      <input
                        data-testid={`refer-contact-${i}`}
                        value={r.contact}
                        onChange={(e) => update(i, "contact", e.target.value)}
                        placeholder="Email, phone, or LinkedIn"
                        className="w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-[#eee7f7] text-[14px] text-[#261c4d] placeholder:text-[#b1a9c6] focus:outline-none focus:border-[#6d46c6]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b1a9c6]" />
                      <input
                        data-testid={`refer-company-${i}`}
                        value={r.company}
                        onChange={(e) => update(i, "company", e.target.value)}
                        placeholder="Company name *"
                        required
                        className="w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-[#eee7f7] text-[14px] text-[#261c4d] placeholder:text-[#b1a9c6] focus:outline-none focus:border-[#6d46c6]"
                      />
                    </div>
                    <button
                      data-testid={`refer-remove-${i}`}
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                      className="h-12 w-12 shrink-0 rounded-xl border border-[#eee7f7] text-[#b1a9c6] hover:text-[#6d46c6] hover:bg-[#f5f3ff] disabled:opacity-40 flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              data-testid="refer-add-btn"
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: PURPLE }}
            >
              <Plus className="w-4 h-4" /> Add another friend
            </button>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
              <div className="flex items-center gap-2 text-[12px] text-[#6b6480]">
                <ShieldCheck className="w-4 h-4" style={{ color: "#0f9b7c" }} />
                Their information is kept secure and never shared publicly.
              </div>
              <button
                data-testid="refer-submit-btn"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full font-semibold text-[14px] disabled:opacity-60 transition-transform hover:-translate-y-[1px]"
                style={{ backgroundColor: MINT, color: PURPLE_DEEP }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Refer &amp; help a friend
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
