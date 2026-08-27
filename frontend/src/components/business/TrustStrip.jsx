import { ShieldCheck, Users, FlaskConical, Leaf, Lock, Scale, GraduationCap, Landmark, Award } from "lucide-react";

const ICONS = {
  "shield-check": ShieldCheck, users: Users, "flask-conical": FlaskConical, leaf: Leaf,
  lock: Lock, scale: Scale, graduation: GraduationCap, landmark: Landmark, award: Award,
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
    { label: "Bar Association member", icon: "scale" },
    { label: "Client confidentiality", icon: "lock" },
  ],
  "fintech": [
    { label: "SOC 2 aware", icon: "lock" },
    { label: "RBI compliant", icon: "landmark" },
  ],
  "saas": [
    { label: "Y Combinator backed", icon: "award" },
    { label: "SOC 2 in progress", icon: "lock" },
    { label: "Enterprise-ready", icon: "shield-check" },
  ],
};

export default function TrustStrip({ business, stats }) {
  const isB2B = business?.audience === "b2b";
  const verticalExtras = VERTICAL_BADGES[business?.vertical] || [];
  const combined = [
    { label: "Verified by Uplaud", icon: "shield-check" },
    { label: `${(stats?.unique_reviewers || 0).toLocaleString()} ${isB2B ? "verified accounts" : "unique reviewers"}`, icon: "users" },
    ...verticalExtras,
    { label: "No incentivised reviews", icon: "shield-check" },
  ];
  const seen = new Set();
  const badges = combined.filter((b) => (seen.has(b.label) ? false : (seen.add(b.label), true))).slice(0, 5);

  return (
    <section className="max-w-[1320px] mx-auto px-6 lg:px-10" data-testid="trust-badges">
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4 border-t border-b border-[color:var(--u-line)]"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[color:var(--u-muted)] shrink-0">
          Trust · Signals
        </span>
        {badges.map((b, i) => {
          const Icon = ICONS[b.icon] || ShieldCheck;
          return (
            <div
              key={i}
              data-testid={`trust-badge-${i}`}
              className="inline-flex items-center gap-1.5 text-xs text-[color:var(--u-ink-2)]"
            >
              <Icon size={13} className={i === 0 ? "text-[color:var(--u-violet)]" : "text-[color:var(--u-mint-2)]"} />
              <span className="font-medium">{b.label}</span>
              {i < badges.length - 1 && <span className="ml-4 text-[color:var(--u-line-2)]">·</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
