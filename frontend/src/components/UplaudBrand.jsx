export default function UplaudBrand({ textClassName = "text-3xl" }) {
  return (
    <span className="inline-flex items-center" aria-label="Uplaud">
      <span
        className={`font-display font-normal tracking-normal leading-none text-[#6d46c6] ${textClassName}`}
        style={{ letterSpacing: "0" }}
      >
        uplaud
      </span>
    </span>
  );
}
