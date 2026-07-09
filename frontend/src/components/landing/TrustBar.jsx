import Marquee from "react-fast-marquee";

const CATEGORIES = [
  "Tutoring centers",
  "SAT & test prep",
  "Preschools",
  "Dental clinics",
  "Dermatology",
  "Pediatricians",
  "Law firms",
  "Immigration",
  "Family law",
  "Vet clinics",
  "Pet grooming",
  "Dog daycare",
];

export default function TrustBar() {
  return (
    <section
      data-testid="trust-bar"
      className="relative border-y border-[#eeeaf6] bg-[#faf9ff] py-10"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 mb-5">
        <span className="section-label">
          Working with businesses like these
        </span>
      </div>
      <div className="marquee-fade">
        <Marquee gradient={false} speed={34} pauseOnHover>
          {CATEGORIES.map((s, i) => (
            <div
              key={i}
              data-testid={`trust-source-${i}`}
              className="mx-4 md:mx-6 px-5 py-2 rounded-full border border-[#eeeaf6] bg-white text-[13px] font-medium text-[#4b5563] hover:text-[#6d46c6] hover:border-[#d9d1ee] transition-colors"
            >
              {s}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
