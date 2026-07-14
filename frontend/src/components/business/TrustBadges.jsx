import { ShieldCheck, Users, FlaskConical, Leaf, Award, Lock, HeartPulse, Scale, GraduationCap, Landmark } from "lucide-react";

const ICONS = {
  "shield-check": ShieldCheck,
  users: Users,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  award: Award,
  lock: Lock,
  "heart-pulse": HeartPulse,
  scale: Scale,
  graduation: GraduationCap,
  landmark: Landmark,
};

const VERTICAL_BADGES = {
  "health-wellness": [
    { label: "Dermatologist tested", icon: "flask-conical" },
    { label: "Cruelty free", icon: "leaf" },
  ],
  "education": [
    { label: "Educator vetted", icon: "graduation" },
    { label: "Outcome tracked", icon: "award" },
  ],
  "legal": [
    { label: "Bar association member", icon: "scale" },
    { label: "Client confidentiality", icon: "lock" },
  ],
  "fintech": [
    { label: "SOC 2 aware", icon: "lock" },
    { label: "RBI compliant", icon: "landmark" },
  ],
};

export default function TrustBadges({ business, stats }) {
  const base = business?.trust_badges || [];
  const verticalExtras = VERTICAL_BADGES[business?.vertical] || [];
  const combined = [
    { label: "Verified by Uplaud", icon: "shield-check" },
    { label: `${(stats?.unique_reviewers || 0).toLocaleString()} unique reviewers`, icon: "users" },
    ...base.filter((b) => !["Verified by Uplaud"].includes(b.label) && !b.label.includes("unique reviewers")),
    ...verticalExtras,
  ];
  const seen = new Set();
  const badges = combined.filter((b) => {
    if (seen.has(b.label)) return false;
    seen.add(b.label);
    return true;
  }).slice(0, 6);

  return (
    <section className="max-w-[1320px] mx-auto px-6 lg:px-10 py-8" data-testid="trust-badges">
      <div className="u-card p-6 lg:p-7 flex flex-wrap items-center gap-x-2 gap-y-3 relative overflow-hidden">
        <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--u-muted)] mr-3 shrink-0">
          Trust · Signals
        </span>
        {badges.map((b, i) => {
          const Icon = ICONS[b.icon] || ShieldCheck;
          return (
            <div
              key={i}
              data-testid={`trust-badge-${i}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm border"
              style={{
                borderColor: "var(--u-line-2)",
                background: i === 0 ? "linear-gradient(135deg, #EEE9FF 0%, #DFF7EE 100%)" : "var(--u-cream-2)",
              }}
            >
              <Icon size={14} className={i === 0 ? "text-[color:var(--u-violet)]" : "text-[color:var(--u-ink-2)]"} />
              <span className="font-medium">{b.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
