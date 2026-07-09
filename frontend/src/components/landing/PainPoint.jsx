export default function PainPoint() {
  return (
    <section
      id="pain"
      data-testid="pain-point-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <span className="section-label">01 / the problem</span>
            <h2
              data-testid="pain-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
            >
              Your best growth channel
              <br />
              is <span className="text-[#6d46c6]">scattered</span> across
              10 platforms.
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#4b5563]">
              Reviews on Trustpilot. DMs on Instagram. Stories in Reddit
              threads. Testimonials buried in email. Praise in sales-call
              transcripts. All that customer trust is real, and none of it is
              working for your acquisition.
            </p>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#4b5563]">
              Meanwhile ads keep getting more expensive and cold clicks keep
              converting less.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              <StatBox stat="+60%" label="paid CAC over 5 yrs" testId="pain-stat-cac" />
              <StatBox stat="-30%" label="ROAS in last 24 mo" testId="pain-stat-roas" />
              <StatBox
                stat="10+"
                label="places trust lives today"
                testId="pain-stat-platforms"
              />
              <StatBox
                stat="0"
                label="of it working for you"
                testId="pain-stat-zero"
                highlight
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBox({ stat, label, testId, highlight }) {
  return (
    <div
      data-testid={testId}
      className={`rounded-2xl p-5 border transition-colors ${
        highlight
          ? "border-[#6d46c6] bg-[#f5f3ff]"
          : "border-[#eeeaf6] bg-[#faf9ff]"
      }`}
    >
      <div
        className={`font-display text-[36px] leading-none tracking-tight font-semibold ${
          highlight ? "text-[#6d46c6]" : "text-[#111827]"
        }`}
      >
        {stat}
      </div>
      <div className="mt-3 text-[11px] font-mono uppercase tracking-wider text-[#4b5563]">
        {label}
      </div>
    </div>
  );
}
