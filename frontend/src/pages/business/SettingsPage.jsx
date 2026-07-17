import { useState } from "react";
import { Save, User, Bell, Plug, Trash2 } from "lucide-react";
import { getAuth, resetBusinessState } from "@/lib/business-storage";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = getAuth() || {};
  const nav = useNavigate();
  const [name, setName] = useState(user.name || "Nick Patel");
  const [email, setEmail] = useState(user.email || "");

  const handleReset = () => {
    resetBusinessState();
    toast.success("Workspace reset to zero-state");
    nav("/business", { replace: true });
  };

  return (
    <div data-testid="settings-page" className="max-w-[820px] space-y-6">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-[#111827]">
        Settings
      </h1>

      <Section icon={User} title="Profile">
        <Field label="Name">
          <input
            data-testid="settings-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
          />
        </Field>
        <Field label="Email">
          <input
            data-testid="settings-email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
          />
        </Field>
      </Section>

      <Section icon={Bell} title="Notifications">
        <Toggle label="Email me when an agent needs approval" defaultOn />
        <Toggle label="Weekly Insights summary" defaultOn />
        <Toggle label="Reddit thread opportunities" />
      </Section>

      <Section icon={Plug} title="Integrations">
        <div className="space-y-2">
          {[
            { name: "Google Reviews", connected: true },
            { name: "Trustpilot", connected: true },
            { name: "LinkedIn (post publisher)", connected: false },
            { name: "X (Twitter API v2)", connected: false },
            { name: "Reddit account", connected: true },
            { name: "HubSpot CRM", connected: false },
          ].map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-3 rounded-xl border border-[#eeeaf6] px-4 py-3"
            >
              <div className="text-[13px] font-medium text-[#111827]">
                {i.name}
              </div>
              <span
                className={`ml-auto text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                  i.connected
                    ? "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]"
                    : "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]"
                }`}
              >
                {i.connected ? "connected" : "connect"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          data-testid="settings-save-btn"
          onClick={() => toast.success("Settings saved")}
          className="btn-primary h-11 !py-0"
        >
          <Save className="w-4 h-4" strokeWidth={1.75} />
          Save changes
        </button>
        <button
          data-testid="settings-reset-btn"
          onClick={handleReset}
          className="btn-secondary h-11 !py-0 text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          Reset workspace (demo)
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
        <div className="text-[14px] font-display font-semibold text-[#111827]">
          {title}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({ label, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#eeeaf6] px-4 py-3">
      <div className="text-[13px] text-[#111827]">{label}</div>
      <button
        onClick={() => setOn(!on)}
        className={`ml-auto w-11 h-6 rounded-full transition-colors relative ${
          on ? "bg-[#6d46c6]" : "bg-[#d9d1ee]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
