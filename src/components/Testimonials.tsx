import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MINT = "#5EEAD4";
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const REVIEWS_TABLE = import.meta.env.VITE_AIRTABLE_REVIEWS_TABLE || '';

const COMPANY_USERS = [
  "Deepthi Rao", "Rohan Vibhuti ", "Shreya Shinde", "Gargi", "Pranali", "Vansh Desai", "Hitanshi"
];

function isValidName(name = "") {
  return /^[a-zA-Z][a-zA-Z\s\-'.]{1,49}$/.test(name.trim());
}
function slugify(name = "") {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[\/\\#\?\%\$\&\*\:\;\"\'\<\>\{\}\[\]\|]/g, "")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const MARQUEE_DURATION = 275;

/* Row that scrolls horizontally. Pauses on hover, press, or touch. */
function MarqueeRow({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const [paused, setPaused] = useState(false);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  const togglePause = () => setPaused((p) => !p);

  return (
    <div
      className="relative w-full flex justify-center overflow-hidden"
      style={{
        minHeight: 210,
        marginBottom: 12,
        maxWidth: "100vw",
      }}
      /* Desktop hover */
      onMouseEnter={pause}
      onMouseLeave={resume}
      /* Works for both mouse and touch */
      onPointerDown={pause}
      onPointerUp={resume}
      /* Tap-to-toggle as an extra (in case of quick taps) */
      onClickCapture={togglePause}
    >
      <div
        className="flex items-center gap-7"
        style={{
          width: "max-content",
          animation: `marquee-${reverse ? "rev" : "fwd"} ${MARQUEE_DURATION}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

function ReviewCard({ review, navigate }: { review: any; navigate: any }) {
  if (!review) return null;
  const nameArr = review.fields["Name_Creator"];
  const userName = Array.isArray(nameArr) ? nameArr[0] : nameArr;
  const business = review.fields["business_name"] || review.fields["Business"] || "";
  const text = review.fields["Uplaud"] || review.fields["Review"] || "";
  const avatar =
    review.fields["Creator Image"] && Array.isArray(review.fields["Creator Image"])
      ? review.fields["Creator Image"][0]?.url
      : review.fields["Creator Image"]?.url || "";

  const bizImageArr = review.fields["Biz Image"] || review.fields["business_image"];
  const bizImage =
    Array.isArray(bizImageArr) && bizImageArr.length > 0
      ? bizImageArr[0]?.url
      : typeof bizImageArr === "object" && bizImageArr?.url
      ? bizImageArr.url
      : "";

  const showAvatar = !!avatar && avatar.trim() !== "";
  const showBizImage = !!bizImage && bizImage.trim() !== "";

  return (
    <figure
      className="spotlight-card relative h-full overflow-hidden rounded-2xl border-2 p-6 shadow-lg bg-white transition-all flex flex-col"
      style={{
        minWidth: 240,
        maxWidth: 340,
        margin: "0 10px",
        border: `2px solid ${MINT}`,
        background: "#fff",
      }}
    >
      {showBizImage && (
        <div
          className="w-full mb-3 flex justify-center"
          style={{
            minHeight: 80,
            maxHeight: 100,
            overflow: "hidden",
            borderRadius: "12px",
          }}
          onClick={() => navigate(`/business/${slugify(business)}`)}
        >
          <img
            src={bizImage}
            alt={business}
            className="object-cover rounded-xl border"
            style={{ width: "100%", maxHeight: 95, cursor: "pointer" }}
            loading="lazy"
          />
        </div>
      )}
      <figcaption
        className="font-extrabold text-base text-[#6D46C6] flex items-center cursor-pointer"
        style={{ marginBottom: "4px" }}
        onClick={() => navigate(`/business/${slugify(business)}`)}
      >
        {business}
      </figcaption>
      <blockquote className="mt-1 text-[15px] text-gray-800 font-medium leading-tight min-h-[36px]">
        {text.length > 130 ? (
          <>
            {text.slice(0, 130)}...
            <span className="font-semibold text-xs text-[#6D46C6]"> more</span>
          </>
        ) : (
          text
        )}
      </blockquote>
      <div className="absolute left-6 bottom-5 flex items-center gap-2">
        {showAvatar && (
          <img
            className="rounded-full shadow"
            src={avatar}
            alt={userName}
            width={32}
            height={32}
            style={{ objectFit: "cover", minWidth: 32, minHeight: 32, cursor: "pointer" }}
            onClick={() => navigate(`/profile/${slugify(userName)}`)}
          />
        )}
        <span
          className="text-xs font-bold text-[#1b9061] cursor-pointer hover:underline"
          onClick={() => navigate(`/profile/${slugify(userName)}`)}
        >
          {userName}
        </span>
      </div>
    </figure>
  );
}

const UpcomingFeatures = () => {
  const navigate = useNavigate();
  const [spotlightReviews, setSpotlightReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchSpotlightReviews = async () => {
      let allRecords: any[] = [];
      let offset: string | undefined = undefined;
      try {
        do {
          const params: any = { pageSize: 100 };
          if (offset) params.offset = offset;
          const resp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, params }
          );
          allRecords = allRecords.concat(resp.data.records);
          offset = resp.data.offset;
        } while (offset);
      } catch (e) { /* ignore */ }

      const now = new Date();
      let filtered = allRecords.filter((r: any) => {
        const nameArr = r.fields["Name_Creator"];
        const name = Array.isArray(nameArr) ? nameArr[0] : nameArr;
        const business = r.fields["business_name"] || r.fields["Business"] || "";
        const text = r.fields["Uplaud"] || r.fields["Review"] || "";
        const dateStr = r.fields["Date_Added"];
        const date = dateStr ? new Date(dateStr) : null;
        return (
          name &&
          business &&
          date &&
          date >= new Date("2025-01-01T00:00:00") &&
          date <= now &&
          !COMPANY_USERS.map(u => u.toLowerCase()).includes((name || "").toLowerCase()) &&
          isValidName(name) &&
          text.length > 4
        );
      });

      const businessLatest: Record<string, any> = {};
      filtered.forEach((r: any) => {
        const business = r.fields["business_name"] || r.fields["Business"] || "";
        const bizSlug = slugify(business);
        if (!bizSlug) return;
        const prev = businessLatest[bizSlug];
        const date = r.fields["Date_Added"] ? new Date(r.fields["Date_Added"]) : null;
        if (!prev || (date && new Date(prev.fields["Date_Added"]) < date)) {
          businessLatest[bizSlug] = r;
        }
      });

      let spotlightArr = Object.values(businessLatest);
      for (let i = spotlightArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spotlightArr[i], spotlightArr[j]] = [spotlightArr[j], spotlightArr[i]];
      }

      setSpotlightReviews(spotlightArr as any[]);
    };
    fetchSpotlightReviews();
  }, []);

  const row1 = spotlightReviews.filter((_, i) => i % 2 === 0);
  const row2 = spotlightReviews.filter((_, i) => i % 2 === 1);

  return (
    <section
      className="relative flex flex-col items-center justify-center w-full"
      style={{
        background: "#fff",
        width: "100vw",
        minHeight: "48vh",
        margin: 0,
        padding: "0px 0px 22px 0px",
      }}
    >
      <div className="w-full max-w-[1600px] flex flex-col items-center" style={{ padding: 0, marginTop: 0 }}>
        <h2
          className="font-extrabold text-3xl sm:text-4xl mb-6 text-center tracking-tight"
          style={{ color: "#6D46C6", letterSpacing: "1px", textShadow: "0 2px 12px #eee" }}
        >
          Uplaud Spotlight
        </h2>

        <div className="w-full flex flex-col gap-6 items-center">
          <MarqueeRow>
            {row1.map((r: any) => (
              <ReviewCard review={r} key={r.id + "-row1"} navigate={navigate} />
            ))}
          </MarqueeRow>
          <MarqueeRow reverse>
            {row2.map((r: any) => (
              <ReviewCard review={r} key={r.id + "-row2"} navigate={navigate} />
            ))}
          </MarqueeRow>
        </div>
      </div>

      {/* Styles to (1) run marquee, (2) force 1 card per row on mobile */}
      <style>{`
        @keyframes marquee-fwd {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-rev {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* Default card width for tablet/desktop */
        .spotlight-card {
          width: 18rem; /* ~288px */
        }

        /* Mobile: show exactly 1 card per row (so two cards total across both rows) */
        @media (max-width: 640px) {
          .spotlight-card {
            width: 88vw !important;
            max-width: 88vw !important;
            min-width: 88vw !important;
            margin: 0 6vw; /* breathing space at sides while centered */
          }
        }
      `}</style>
    </section>
  );
};

export default UpcomingFeatures;
