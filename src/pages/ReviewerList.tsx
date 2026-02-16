import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Crown, Medal, Award, MessageCircle, ArrowLeft } from "lucide-react";

/* ===================== Theme / Airtable ===================== */
const PRIMARY = "#6214a8";
const MINT = "#5EEAD4";

const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || "";
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || "";
const REVIEWS_TABLE = import.meta.env.VITE_AIRTABLE_REVIEWS_TABLE || "";
const CIRCLES_TABLE = import.meta.env.VITE_AIRTABLE_CIRCLES_TABLE || "";

const AIRTABLE = axios.create({
  baseURL: `https://api.airtable.com/v0/${BASE_ID}/`,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

/** Generic, safe Airtable paginator */
async function fetchAllPages<T = any>(
  table: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const out: T[] = [];
  let offset: string | undefined = undefined;
  let guard = 0;
  do {
    const resp = await AIRTABLE.get(table, {
      params: { ...params, pageSize: 100, offset },
    });
    const recs = resp.data?.records || [];
    out.push(...recs);
    offset = resp.data?.offset;
    guard++;
  } while (offset && guard < 100);
  return out;
}

/* ===================== Company users (excluded from leaderboard) ===================== */
const COMPANY_USERS = [
  "Deepthi Rao",
  "Deepthi",
  "Rohan",
  "Rohan Vibhuti ",
  "Shreya Shinde",
  "Gargi",
  "Pranali Gole",
  "Pranali",
  "Vansh Desai",
  "Hitanshi Dhaktode",
];

/* ===================== Sticky Logo Navbar (logo -> previous page) ===================== */
function StickyLogoNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#6214a8]/95 backdrop-blur-sm shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <button onClick={goBack} className="flex items-center" aria-label="Go back">
            <img
              alt="Uplaud Logo"
              className="h-10 w-auto object-fill"
              src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png"
            />
          </button>
          <div className="w-10 h-10" />
        </div>
      </div>
    </nav>
  );
}

/* ===================== Utils ===================== */
function isValidName(name = "") {
  return /^[a-zA-Z][a-zA-Z\s\-'.]{1,49}$/.test((name || "").trim());
}
function slugify(name = "") {
  return (name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[\/\\#\?\%\$\&\*\:\;\"\'\<\>\{\}\[\]\|]/g, "")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
function toDateOnlyISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getPeriodFilter(period: "weekly" | "monthly" | "all-time") {
  if (period === "weekly") {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return `IS_AFTER({Date_Added}, '${toDateOnlyISO(start)}')`;
  } else if (period === "monthly") {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return `IS_AFTER({Date_Added}, '${toDateOnlyISO(start)}')`;
  }
  return ""; // all-time
}

type PeriodKey = "weekly" | "monthly" | "all-time";

const periodTabs = [
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "Monthly" },
  { key: "all-time", label: "All Time" },
] as const;

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-7 h-7 text-yellow-500 drop-shadow" />;
    case 2:
      return <Medal className="w-7 h-7 text-gray-400 drop-shadow" />;
    case 3:
      return <Award className="w-7 h-7 text-orange-500 drop-shadow" />;
    default:
      return (
        <span className="w-7 h-7 flex items-center justify-center text-muted-foreground font-bold">
          {rank}
        </span>
      );
  }
};

/* ===================== Airtable fetchers (refactored) ===================== */
async function fetchFilteredReviews(period: PeriodKey) {
  const filterByFormula = getPeriodFilter(period);
  const params: Record<string, any> = {
    fields: ["ID (from Creator)", "Name_Creator", "Date_Added"],
  };
  if (filterByFormula) params.filterByFormula = filterByFormula;
  return fetchAllPages<any>(REVIEWS_TABLE, params);
}

async function fetchAllCircles() {
  // Pull all; if you add period filtering later, mirror the reviews approach
  return fetchAllPages<any>(CIRCLES_TABLE, {});
}

/* ===================== Page ===================== */
const Leaderboard = () => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultPeriod = () =>
    (localStorage.getItem("leaderboardPeriod") as PeriodKey) || "weekly";
  const [period, setPeriod] = useState<PeriodKey>(defaultPeriod());

  const navigate = useNavigate();
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchData, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviews, circles] = await Promise.all([
        fetchFilteredReviews(period),
        fetchAllCircles(),
      ]);

      const userMap: Record<number, any> = {};
      const reviewedUserIds = new Set<number>();
      const companyLower = COMPANY_USERS.map((u) => u.toLowerCase());

      // Aggregate reviews
      for (const r of reviews) {
        // Airtable can return arrays for lookup/rollup fields; normalize
        const idRaw = r.fields?.["ID (from Creator)"];
        const nameRaw = r.fields?.["Name_Creator"];
        const dateStr = r.fields?.["Date_Added"];

        const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
        const name = Array.isArray(nameRaw) ? nameRaw[0] : nameRaw;
        const reviewDate = dateStr ? new Date(dateStr) : null;

        if (
          typeof id === "number" &&
          typeof name === "string" &&
          reviewDate instanceof Date &&
          !isNaN(reviewDate.getTime()) &&
          !companyLower.includes(name.toLowerCase()) &&
          isValidName(name)
        ) {
          reviewedUserIds.add(id);
          if (!userMap[id]) {
            userMap[id] = {
              creatorId: id,
              creatorName: name,
              reviewCount: 1,
              referralCount: 0,
              points: 0,
              latestDate: reviewDate,
            };
          } else {
            userMap[id].reviewCount += 1;
            if (reviewDate > userMap[id].latestDate) {
              userMap[id].latestDate = reviewDate;
            }
          }
        }
      }

      // Aggregate referrals
      for (const rec of circles) {
        const initiator = rec.fields?.["Initiator"];
        const receiver = rec.fields?.["Receiver"];

        // These may be numbers or arrays of numbers — normalize
        const initiatorId = Array.isArray(initiator) ? initiator[0] : initiator;
        const receiverId = Array.isArray(receiver) ? receiver[0] : receiver;

        if (
          typeof initiatorId === "number" &&
          typeof receiverId === "number" &&
          reviewedUserIds.has(receiverId)
        ) {
          if (!userMap[initiatorId]) {
            userMap[initiatorId] = {
              creatorId: initiatorId,
              creatorName: `User ${initiatorId}`,
              reviewCount: 0,
              referralCount: 1,
              points: 0,
              latestDate: new Date("2024-01-01T00:00:00"),
            };
          } else {
            userMap[initiatorId].referralCount += 1;
          }
        }
      }

      // Compute points
      Object.values(userMap).forEach((user: any) => {
        user.points = user.reviewCount * 10 + user.referralCount * 20;
      });

      // Sort: points desc, then reviewCount desc, then latestDate desc
      const sorted = Object.values(userMap).sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return (b.latestDate?.getTime?.() || 0) - (a.latestDate?.getTime?.() || 0);
      });

      setTopUsers(sorted.slice(0, 5));
    } catch {
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (key: PeriodKey) => {
    setPeriod(key);
    localStorage.setItem("leaderboardPeriod", key);
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: PRIMARY }}>
      {/* Sticky logo navbar */}
      <StickyLogoNavbar />

      {/* Back Button (optional, top-left) */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-20 left-2 sm:top-24 sm:left-7 z-20 flex items-center gap-1 px-2 py-2 bg-white/80 hover:bg-[#eee] rounded-full shadow-sm border border-[#ececec] backdrop-blur-md transition-all duration-200"
        style={{ fontWeight: 600, fontSize: 18, color: PRIMARY, cursor: "pointer" }}
        aria-label="Back"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero header */}
      <div className="relative overflow-hidden pb-4 pt-24">
        <div className="absolute inset-0" style={{ background: PRIMARY, opacity: 1 }} />
        <div className="relative px-4 sm:px-6 py-10 sm:py-16 text-center">
          <div className="max-w-2xl sm:max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-xl">
              🏆 Top Reviewers
            </h1>
            <p className="text-base sm:text-xl text-[#ece5f4] mb-6 sm:mb-8 max-w-2xl mx-auto font-medium">
              Celebrating our amazing community members who help businesses grow through authentic
              reviews.
            </p>
            <div className="flex justify-center gap-2 mb-7 sm:mb-8 flex-wrap">
              {periodTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-5 sm:px-7 py-2 rounded-full text-base sm:text-lg font-bold shadow-md border-2 transition-all duration-200 ${
                    period === tab.key
                      ? "bg-[#5EEAD4] text-[#6214a8] border-[#6214a8] scale-105"
                      : "text-white/80 border-[#5EEAD4]"
                  }`}
                  onClick={() => handlePeriodChange(tab.key)}
                  style={{ minWidth: 90, background: period === tab.key ? undefined : PRIMARY }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="px-1 sm:px-4 pb-10 sm:pb-16" style={{ marginTop: "-50px" }}>
        <div className="max-w-lg sm:max-w-3xl mx-auto space-y-2 sm:space-y-5">
          {loading ? (
            <div className="flex justify-center items-center py-10 sm:py-16">
              <div className="animate-spin rounded-full border-t-4 border-[#fff] border-opacity-50 h-12 w-12 sm:h-14 sm:w-14"></div>
            </div>
          ) : topUsers.length === 0 ? (
            <div className="text-center text-white/60 py-8 sm:py-10">No reviewers found.</div>
          ) : (
            topUsers.map((entry: any, idx: number) => (
              <div
                key={entry.creatorId}
                onClick={() => navigate(`/profile/${slugify(entry.creatorName)}`)}
                className="flex items-center px-3 sm:px-7 py-3 sm:py-6 rounded-2xl border transition-all duration-300 cursor-pointer group bg-white border border-gray-100 leaderboard-card"
                style={{
                  minHeight: 48,
                  position: "relative",
                  zIndex: 2,
                  boxShadow: "0 2px 8px #49208810",
                }}
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mr-2 sm:mr-4">
                  {getRankIcon(idx + 1)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center justify-between">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#261c4d] group-hover:text-[#6214a8] transition truncate max-w-[120px] sm:max-w-full">
                      {entry.creatorName}
                    </h3>
                    <span className="block sm:hidden text-xl font-bold" style={{ color: PRIMARY }}>
                      {entry.points}{" "}
                      <span className="text-xs text-[#bfa7ea] font-semibold">pts</span>
                    </span>
                  </div>
                  <div className="flex flex-row flex-wrap gap-x-2 gap-y-1 text-[14px] sm:text-[15px] text-[#737373] mt-1 font-medium">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {entry.reviewCount} {entry.reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-end pr-2">
                  <span className="text-2xl md:text-3xl font-bold leading-5" style={{ color: PRIMARY }}>
                    {entry.points}
                  </span>
                  <span className="text-sm font-semibold" style={{ marginTop: "-1px", color: "#bfa7ea" }}>
                    points
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          minHeight: "30vh",
          width: "100vw",
          background: MINT,
          color: "#24292F",
          marginTop: 24,
          padding: "22px 0 30px 0",
        }}
      >
        <h3
          className="text-lg sm:text-2xl font-extrabold flex items-center justify-center gap-2 mb-2 sm:mb-3 text-[#24292F]"
          style={{ letterSpacing: ".5px" }}
        >
          🚀 Want to start reviewing too?
        </h3>
        <p className="text-sm sm:text-base mb-4 sm:mb-5 text-[#274046] text-center max-w-xs sm:max-w-2xl font-medium">
          Join our community of reviewers and share your experiences with others.
          <br />
          It's as easy as sending a WhatsApp message!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 flex-wrap justify-center mb-3 w-full px-4">
          <a
            href="https://api.whatsapp.com/message/XVZR77KDFQMHI1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#fff] px-7 py-3 rounded-full text-base sm:text-lg font-bold transition shadow text-center"
            style={{ minWidth: 140, background: PRIMARY }}
          >
            🚀 Try Uplaud
          </a>
          <button
            onClick={() => navigate("/login")}
            className="px-7 py-3 border-2 rounded-full text-base sm:text-lg font-bold hover:bg-white/20 transition text-center"
            style={{ minWidth: 140, color: PRIMARY, borderColor: PRIMARY }}
          >
            Login
          </button>
        </div>
        <p className="text-[#222f3e] text-xs sm:text-sm mt-2 text-center w-full px-3 opacity-70">
          No app download required — start reviewing in seconds.
        </p>
      </div>

      {/* Effects / background enforcement */}
      <style>{`
        body { background: ${PRIMARY} !important; }
        .leaderboard-card {
          transition: box-shadow 0.24s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
        }
        .leaderboard-card:hover {
          box-shadow: 0 4px 32px 6px ${PRIMARY}, 0 0 2px #fff;
          transform: scale(1.045);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
