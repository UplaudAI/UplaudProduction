export default function UplaudLogo({ className = "", markClassName = "", textClassName = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="Uplaud">
      <span
        className={`inline-flex items-center justify-center rounded-full text-white font-display font-semibold ${markClassName || "h-10 w-10 text-lg"}`}
        style={{
          background:
            "conic-gradient(from 210deg at 50% 50%, #5B3EEE 0%, #7CE8C8 42%, #7C5CE8 72%, #5B3EEE 100%)",
        }}
      >
        u
      </span>
      <span className={`font-display font-semibold tracking-tight text-[#111827] ${textClassName || "text-2xl"}`}>
        uplaud
      </span>
    </span>
  );
}
