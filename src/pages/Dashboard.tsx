import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  ClipboardList,
  Zap,
  Calendar,
  MapPin,
  ArrowLeft,
  Share2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { buildWhatsAppShareUrl, buildSharePageUrl } from "@/utils/buildShareUrl";

// shadcn/ui
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ===================== Sticky Logo Navbar (same as Profile) ===================== */
function StickyLogoNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#6214a8]/95 backdrop-blur-sm shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              alt="Uplaud Logo"
              className="h-10 w-auto object-fill"
              src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png"
            />
          </Link>
          <div className="w-10 h-10" />
        </div>
      </div>
    </nav>
  );
}

/* ===================== Utilities (mirrored from Profile) ===================== */
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
function formatDate(date?: Date | string | null) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}
function emojiForScore(score?: number) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function getWhatsAppShareLink(user?: any) {
  const handle = user?.handle || "me";
  const profileUrl = `${window.location.origin}/profile/${handle}`;
  let phone = user?.autogenInvite || "";
  const m = phone?.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (m && m[1]) phone = m[1];
  phone = (phone || "").replace(/[^0-9]/g, "");
  const msg = `Check out ${user?.name}'s Uplaud profile!\n${profileUrl}`;
  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/* ===================== Badges (same structure as Profile) ===================== */
const BADGES = [
  {
    key: "fresh_voice",
    label: "Fresh Voice",
    description: "Submit your first review",
    image: "Fresh_Voice.png",
    progress: (user: any) => ({
      current: user.reviews.length,
      total: 1,
      isEarned: user.reviews.length >= 1,
    }),
  },
  {
    key: "glow_getter",
    label: "Glow Getter",
    description: "Submit 10+ reviews",
    image: "Glow_Getter.png",
    progress: (user: any) => ({
      current: Math.min(user.reviews.length, 10),
      total: 10,
      isEarned: user.reviews.length >= 10,
    }),
  },
  {
    key: "vibe_curator",
    label: "Vibe Curator",
    description: "Submit reviews in 5+ different categories",
    image: "Vibe_Curator.png",
    progress: (user: any) => {
      const catCount = new Set(
        user.reviews.map((r: any) => (r.category || "").toLowerCase())
      ).size;
      return { current: Math.min(catCount, 5), total: 5, isEarned: catCount >= 5 };
    },
  },
  {
    key: "cultural_explorer",
    label: "Cultural Explorer",
    description: "10+ reviews in Museums/Nature categories",
    image: "Cultural_Explorer.png",
    progress: (user: any) => {
      const count = user.reviews.filter((r: any) =>
        ["museum", "nature"].includes((r.category || "").toLowerCase())
      ).length;
      return { current: Math.min(count, 10), total: 10, isEarned: count >= 10 };
    },
  },
  {
    key: "squad_initiator",
    label: "Squad Initiator",
    description: "Refer 1 friend who joins & reviews",
    image: "Squad_Initiator.png",
    progress: (user: any) => ({
      current: Math.min(user.referralCount, 1),
      total: 1,
      isEarned: user.referralCount >= 1,
    }),
  },
  {
    key: "squad_leader",
    label: "Squad Leader",
    description: "5+ successful referrals",
    image: "Squad_Leader.png",
    progress: (user: any) => ({
      current: Math.min(user.referralCount, 5),
      total: 5,
      isEarned: user.referralCount >= 5,
    }),
  },
  {
    key: "streak_star",
    label: "Streak Star",
    description: "Review for 7 consecutive days",
    image: "Streak_Star.png",
    progress: (user: any) => {
      const days = [
        ...new Set(
          user.reviews
            .map((r: any) => {
              const d =
                r.date instanceof Date ? r.date : r.date ? new Date(r.date) : null;
              return d && !isNaN(d.getTime()) ? d.toDateString() : null;
            })
            .filter(Boolean)
        ),
      ]
        .map((d: any) => new Date(d))
        .sort((a: any, b: any) => (a as any) - (b as any));

      let streak = 1,
        maxStreak = 1;
      for (let i = 1; i < days.length; i++) {
        if ((days[i] as any) - (days[i - 1] as any) === 24 * 3600 * 1000) streak++;
        else streak = 1;
        maxStreak = Math.max(maxStreak, streak);
      }
      return { current: Math.min(maxStreak, 7), total: 7, isEarned: maxStreak >= 7 };
    },
  },
  {
    key: "viral_star",
    label: "Viral Star",
    description: "10+ referrals in 1 week",
    image: "Viral_Star.png",
    progress: (user: any) => {
      const refs = user.myReferrals || [];
      if (refs.length < 10) return { current: 0, total: 10, isEarned: false };
      const refDates = refs
        .map((ref: any) => (ref.date ? new Date(ref.date) : null))
        .filter(Boolean)
        .sort((a: any, b: any) => (a as any) - (b as any));
      let earned = false;
      for (let i = 0; i <= refDates.length - 10; i++) {
        const start = refDates[i] as any;
        const end = refDates[i + 9] as any;
        if (end - start <= 7 * 24 * 3600 * 1000) {
          earned = true;
          break;
        }
      }
      return { current: Math.min(refs.length, 10), total: 10, isEarned: earned };
    },
  },
];
const getGenderFolder = (gender?: string) =>
  !gender ? "Male" : gender.toLowerCase().startsWith("f") ? "Female" : "Male";

function getAchievements(user: any, reviews: any[], referralCount: number, myReferrals: any[]) {
  const gender = getGenderFolder(user?.gender || user?.Gender);
  const userObj = {
    ...user,
    reviews: reviews || [],
    referralCount: referralCount || 0,
    myReferrals: myReferrals || [],
  };
  return BADGES.map((badge) => {
    const p = badge.progress(userObj);
    return {
      id: badge.key,
      name: badge.label,
      description: badge.description,
      image: `/badges/${gender}/${badge.image}`,
      isEarned: p.isEarned,
      progress: p,
    };
  });
}

/* ===================== Touch detection ===================== */
function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mq.matches);
    update();
    // @ts-ignore
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      // @ts-ignore
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);
  return isTouch;
}

/* ===================== Colored stat pills (same as Profile) ===================== */
const ColoredStatsTabs = ({ totalReviews, points, referralCount }: any) => {
  const Pill = ({ bg, ring, icon, label, value }: any) => (
    <div
      className={`rounded-xl ${bg} ${ring} px-2.5 py-1.5 sm:px-4 sm:py-3 shadow-sm flex items-center justify-center gap-2 sm:gap-3`}
      style={{ backdropFilter: "blur(4px)" }}
    >
      {icon}
      <span className="text-base sm:text-lg font-extrabold tabular-nums">{value}</span>
      <span className="text-[12px] sm:text-[13px] font-semibold whitespace-nowrap">
        {label}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Pill
        bg="bg-amber-50 text-amber-800"
        ring="ring-1 ring-amber-200"
        icon={<Star className="w-3 h-3" />}
        label="Reviews"
        value={totalReviews}
      />
      <Pill
        bg="bg-violet-50 text-violet-800"
        ring="ring-1 ring-violet-200"
        icon={<Zap className="w-3 h-3" />}
        label="Points"
        value={points}
      />
      <Pill
        bg="bg-rose-50 text-rose-800"
        ring="ring-1 ring-rose-200"
        icon={<ClipboardList className="w-3 h-3" />}
        label="Referrals"
        value={referralCount}
      />
    </div>
  );
};

/* ===================== Badge tile (same behaviors) ===================== */
function BadgeTile({
  badge,
  locked = false,
  showProgress = false,
  size = 84,
  textClass,
  progressTextClass,
}: {
  badge: {
    id: string;
    name: string;
    description: string;
    image: string;
    progress?: { current: number; total: number };
  };
  locked?: boolean;
  showProgress?: boolean;
  size?: number;
  textClass?: string;
  progressTextClass?: string;
}) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(false);

  const nameColor = textClass || (locked ? "text-gray-800" : "text-white");
  const pct =
    badge.progress && badge.progress.total > 0
      ? Math.min(100, (badge.progress.current / badge.progress.total) * 100)
      : 0;

  const inner = (
    <div
      className="cursor-pointer text-center relative"
      style={{ width: size, margin: "0 auto" }}
      onClick={() => isTouch && setOpen((o) => !o)}
    >
      <div className="relative rounded-xl overflow-hidden" style={{ width: size, height: size }}>
        <img
          src={badge.image}
          alt={badge.name}
          className="w-full h-full object-contain"
          style={{ background: "transparent" }}
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white/90 drop-shadow" />
          </div>
        )}
      </div>

      <p className={`mt-1 text-[11px] font-semibold leading-tight ${nameColor}`}>{badge.name}</p>

      {showProgress && badge.progress && (
        <div className="mt-1">
          <div className="w-full rounded-full h-1 bg-white/30">
            <div className="bg-purple-600 h-1 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className={`${progressTextClass || "text-white/90"} text-[10px] mt-1`}>
            {badge.progress.current}/{badge.progress.total}
          </p>
        </div>
      )}

      {/* Mobile pop-out */}
      {isTouch && open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-44 rounded-md border bg-white text-gray-800 text-xs shadow-lg px-3 py-2">
          <div className="font-semibold">{badge.name}</div>
          <div className="opacity-80 mt-0.5">{badge.description}</div>
        </div>
      )}
    </div>
  );

  if (isTouch) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-xs border"
        style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}
      >
        <div className="text-center">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs opacity-90 mt-1">{badge.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/* ========= REVIEW CARD (copied look from Profile) ========= */
const ReviewCardLocal = ({ review }: any) => {
  if (!review.businessName || !review.uplaud) return null;

  const reviewParams = {
    reviewerName: review.reviewerName || "Uplaud User",
    businessName: review.businessName,
    reviewText: review.uplaud,
    score: review.score || 5,
  };

  const handleShareToWhatsAppOnly = () => {
    window.location.href = buildWhatsAppShareUrl(reviewParams);
  };

  const handleShareToStory = () => {
    window.open(buildSharePageUrl(reviewParams), "_blank");
  };

  return (
    <div
      className="flex flex-col rounded-2xl shadow transition hover:shadow-xl overflow-hidden"
      style={{ background: "#FFF7E6" }}
    >
      <div className="w-full px-5 pt-5">
        {/* Title row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to={`/business/${slugify(review.businessName)}`}
            className="w-full sm:flex-1 font-bold text-base sm:text-lg text-black hover:underline hover:text-purple-700 break-words whitespace-normal leading-tight"
            title={review.businessName}
            style={{ hyphens: "auto" }}
          >
            {review.businessName}
          </Link>

          {/* Desktop meta (transparent share) */}
          <div className="hidden sm:flex items-center gap-3 sm:ml-auto">
            {review.score ? (
              <span className="flex items-center leading-none">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm sm:text-lg leading-none">
                    ★
                  </span>
                ))}
                <span className="ml-1 text-lg sm:text-2xl leading-none">
                  {emojiForScore(review.score)}
                </span>
              </span>
            ) : null}

            <span className="text-gray-500 text-xs sm:text-sm font-medium leading-none">
              {formatDate(review.date)}
            </span>

            <button
              onClick={handleShareToWhatsAppOnly}
              className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-transparent focus:bg-transparent border-0 shadow-none"
              aria-label="Share this review on WhatsApp"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>

            <button
              onClick={handleShareToStory}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #833AB4, #C13584, #E1306C, #F77737)" }}
              title="Share to Instagram Story"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Story
            </button>
          </div>
        </div>

        {/* Mobile meta (transparent share) */}
        <div className="sm:hidden mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {review.score ? (
              <span className="flex items-center leading-none">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm leading-none">
                    ★
                  </span>
                ))}
                <span className="ml-1 text-xl leading-none">{emojiForScore(review.score)}</span>
              </span>
            ) : null}
            <span className="text-gray-600 text-xs font-medium leading-none">
              {formatDate(review.date)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareToWhatsAppOnly}
              className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-transparent focus:bg-transparent border-0 shadow-none"
              aria-label="Share this review on WhatsApp"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>

            <button
              onClick={handleShareToStory}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #833AB4, #C13584, #E1306C, #F77737)" }}
              title="Share to Instagram Story"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Story
            </button>
          </div>
        </div>
      </div>

      {/* Review body */}
      <div className="mt-3 w-full">
        <div
          className="w-full px-5 py-4 text-gray-900 text-base font-medium break-words"
          style={{ background: "#DCF8C6" }}
        >
          <span style={{ display: "block", wordBreak: "break-word" }}>{review.uplaud}</span>
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
};

/* ===================== Dashboard ===================== */
const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Reviews" | "Analytics">("Reviews");
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [referralCount] = useState(0);
  const [myReferrals] = useState<any[]>([]);

  const isTouch = useIsTouch();
  const badgeMin = isTouch ? 84 : 128;

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        const phone = sessionStorage.getItem("userPhone");
        if (!phone) {
          navigate("/login");
          return;
        }

        // ===== Fetch reviews from your backend (no Airtable PAT in the browser) =====
        // Expected response shape:
        // { reviews: [{ businessName, uplaud, score, category, date, shareLink, referralLink, raw: { Name_Creator, Reviewer, Gender, City, State, "Creator Image", "Autogen Invite", Internal } }] }
        const { data } = await axios.get("/api/reviews", {
          params: { reviewerPhone: phone },
        });

        const records = (data?.reviews || [])
          .map((f: any) => ({
            businessName: f.businessName,
            uplaud: f.uplaud,
            score: typeof f.score === "number" ? f.score : Number(f.score || 0),
            category: f.category || "Other",
            date: f.date ? new Date(f.date) : null,
            shareLink: f.shareLink || "",
            referralLink: f.referralLink || "",
            reviewerName: f.user || (Array.isArray(f.raw?.Name_Creator) ? f.raw.Name_Creator[0] : f.raw?.Name_Creator) || "Uplaud User",
            raw: f.raw || {},
          }))
          .filter((r: any) => r.businessName && r.uplaud)
          .sort((a: any, b: any) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return (b.date?.getTime?.() ?? 0) - (a.date?.getTime?.() ?? 0);
          });

        setReviews(records);

        let name: any =
          records[0]?.raw?.Name_Creator || records[0]?.raw?.Reviewer || "User";
        if (Array.isArray(name)) name = name[0];

        const handle = slugify(name || "user");
        const gender = records[0]?.raw?.Gender || "Male";

        setUser({
          name,
          handle,
          gender,
          image: records[0]?.raw?.["Creator Image"] || null,
          location: [records[0]?.raw?.City, records[0]?.raw?.State]
            .filter(Boolean)
            .join(", "),
          bio: records[0]?.raw?.Internal || "",
          autogenInvite: records[0]?.raw?.["Autogen Invite"] || "",
        });
      } catch {
        setUser(null);
        setReviews([]);
      }
      setLoading(false);
    };
    fetchUserAndReviews();
  }, [navigate]);

  // Stats
  const pointsPerReview = 10;
  const pointsPerReferral = 20;
  const totalReviews = reviews.length;
  const pointsFromReviews = totalReviews * pointsPerReview;
  const pointsFromReferrals = (referralCount || 0) * pointsPerReferral;
  const points = pointsFromReviews + pointsFromReferrals;

  const joinDate =
    reviews.length > 0 && reviews[reviews.length - 1].date
      ? formatDate(reviews[reviews.length - 1].date)
      : "—";

  // Achievements
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedAchievements = achievements.filter((a: any) => a.isEarned);
  const lockedAchievements = achievements.filter((a: any) => !a.isEarned);

  // Points breakdown list (reviews only; referrals list removed)
  const reviewBreakdownItems = reviews.slice(0, 10).map((r) => ({
    label: `Review: ${r.businessName}`,
    when: r.date ? formatDate(r.date) : "",
  }));

  const handleShareProfileToWhatsAppOnly = () => {
    const wa = getWhatsAppShareLink(user);
    window.open(wa, "_blank");
  };

  const [openReviewsPB, setOpenReviewsPB] = useState(true);
  const [openRefPB, setOpenRefPB] = useState(true);

  if (loading)
    return (
      <>
        <StickyLogoNavbar />
        <div
          className="flex justify-center items-center h-80 text-lg text-white pt-20"
          style={{ background: "transparent" }}
        >
          Loading…
        </div>
      </>
    );
  if (!user)
    return (
      <>
        <StickyLogoNavbar />
        <div
          className="min-h-screen flex items-center justify-center text-white pt-20"
          style={{ background: "transparent" }}
        >
          User not found. Please log in again.
        </div>
      </>
    );

  return (
    <div
      className="min-h-screen w-full font-sans text-gray-800 relative"
      style={{
        background: "transparent", // page shows body color (#6214a8)
        fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif`,
      }}
    >
      {/* Sticky logo navbar */}
      <StickyLogoNavbar />

      {/* Page content */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10 px-2 sm:px-0 pt-24">
        {/* Back button row */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => navigate("/")}
            className="font-semibold rounded-md border border-purple-100 flex items-center gap-2 shadow hover:bg-purple-50 px-3 py-2 text-base transition"
            style={{
              minWidth: 44,
              minHeight: 44,
              background: "rgba(255,255,255,0.88)",
              color: "#6214a8",
              backdropFilter: "blur(6px)",
            }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Header card (matches Profile) */}
        <div
          className="shadow-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-5 border mt-2"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-purple-700 select-none">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                user?.name?.split(" ").map((n: string) => n[0]).join("")
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-xl sm:text-2xl truncate">
                    {user?.name}
                  </h2>
                  {user?.handle && (
                    <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">
                      @{user.handle}
                    </span>
                  )}
                </div>

                {/* Mobile share (WhatsApp only) */}
                <button
                  onClick={handleShareProfileToWhatsAppOnly}
                  className="sm:hidden shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-2 shadow"
                  aria-label="Share profile on WhatsApp"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <p className="text-sm flex flex-wrap items-center gap-2 text-gray-700 mt-1">
                <Calendar size={16} /> Joined {joinDate}
                {user?.location && (
                  <>
                    <MapPin size={16} /> {user.location}
                  </>
                )}
              </p>
              {user?.bio && <p className="text-sm mt-1 text-gray-700">{user.bio}</p>}
            </div>

            {/* Desktop share (WhatsApp only) */}
            <button
              onClick={handleShareProfileToWhatsAppOnly}
              className="hidden sm:flex items-center justify-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow"
              title="Share on WhatsApp"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)" }}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <ColoredStatsTabs
            totalReviews={totalReviews}
            points={points}
            referralCount={referralCount}
          />
        </div>

        {/* Earned badges */}
        <Card
          className="w-full backdrop-blur-md"
          style={{
            background: "rgba(255,255,255,0.16)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div className="px-3 pb-3 pt-3">
            {earnedAchievements.length === 0 ? (
              <div className="text-center text-white/90 py-1 text-sm">
                No badges yet — start reviewing to earn your first badge!
              </div>
            ) : (
              <TooltipProvider>
                <div
                  className="gap-3 grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${badgeMin}px, 1fr))`,
                  }}
                >
                  {earnedAchievements.map((a: any) => (
                    <BadgeTile key={a.id} badge={a} size={badgeMin} />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </div>
        </Card>

        {/* Tabs (Reviews / Activity) — same layout; no inner "Activity" header */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "transparent", borderColor: "transparent" }}
        >
          <div className="flex gap-6 mb-6 text-base font-semibold border-b border-white/30">
            <button
              className={`pb-2 -mb-[2px] px-1 transition ${
                activeTab === "Reviews"
                  ? "text-white border-b-2 border-white"
                  : "text-white/80 hover:text-white"
              }`}
              onClick={() => setActiveTab("Reviews")}
            >
              Reviews
            </button>
            <button
              className={`pb-2 -mb-[2px] px-1 transition ${
                activeTab === "Analytics"
                  ? "text-white border-b-2 border-white"
                  : "text-white/80 hover:text-white"
              }`}
              onClick={() => setActiveTab("Analytics")}
            >
              Activity
            </button>
          </div>

          {activeTab === "Reviews" && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center text-white/90 py-8">
                  You haven’t posted any reviews yet.
                </div>
              ) : (
                <div>
                  <div className="space-y-7">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map(
                      (review, idx) => (
                        <ReviewCardLocal key={idx} review={review} />
                      )
                    )}
                  </div>
                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button
                        className="px-5 py-2 rounded-lg bg-white/15 text-white font-bold hover:bg-white/25 shadow transition"
                        onClick={() => setShowAllReviews((prev) => !prev)}
                      >
                        {showAllReviews ? "Show Less" : "Load More Reviews"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "Analytics" && (
            <div>
              {/* Points Breakdown (no extra 'Activity' header, no referrals list) */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="rounded-xl p-3 bg-white/90 backdrop-blur border shadow-sm overflow-hidden box-border">
                  <div className="text-gray-900 text-sm mb-2">
                    <div>
                      Total Points: <span className="font-bold">{points}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      (10 points per review, 20 points per successful referral)
                    </div>
                  </div>

                  {/* Reviews accordion and list */}
                  <button
                    onClick={() => setOpenReviewsPB((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-3 bg-amber-50 hover:bg-amber-100 transition border border-amber-200"
                  >
                    <span className="text-sm font-semibold text-amber-900 min-w-0 truncate">
                      From Reviews ({totalReviews})
                    </span>
                    <span className="text-sm font-bold text-amber-900 shrink-0">
                      +{pointsFromReviews}
                    </span>
                    {openReviewsPB ? (
                      <ChevronUp className="w-4 h-4 text-amber-900 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-900 shrink-0" />
                    )}
                  </button>

                  {openReviewsPB && reviewBreakdownItems.length > 0 && (
                    <ul className="mt-2 grid gap-1.5">
                      {reviewBreakdownItems.map((it, i) => (
                        <li
                          key={`rev-${i}`}
                          className="text-xs flex items-center justify-between gap-2 bg-white hover:bg-white rounded-md px-3 py-2 border transition min-w-0"
                          style={{ borderColor: "rgba(0,0,0,0.08)" }}
                        >
                          <span className="truncate min-w-0">
                            {it.label}{" "}
                            {it.when ? (
                              <span className="text-gray-500">({it.when})</span>
                            ) : null}
                          </span>
                          <span className="font-semibold ml-2 shrink-0">+10</span>
                        </li>
                      ))}
                      {totalReviews > reviewBreakdownItems.length && (
                        <li className="text-xs text-gray-500 px-1 py-1">
                          + {totalReviews - reviewBreakdownItems.length} more…
                        </li>
                      )}
                    </ul>
                  )}

                  {/* Referrals accordion (no inner list; just totals) */}
                  <div className="mt-3">
                    <button
                      onClick={() => setOpenRefPB((o) => !o)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-3 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
                    >
                      <span className="text-sm font-semibold text-emerald-900 min-w-0 truncate">
                        From Referrals ({referralCount})
                      </span>
                      <span className="text-sm font-bold text-emerald-900 shrink-0">
                        +{pointsFromReferrals}
                      </span>
                      {openRefPB ? (
                        <ChevronUp className="w-4 h-4 text-emerald-900 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-emerald-900 shrink-0" />
                      )}
                    </button>
                    {/* Intentionally no details/list below per request */}
                  </div>
                </div>
              </div>

              {/* Badge Goals */}
              <div className="mb-2">
                <div className="font-semibold text-white mb-2">Badge Goals</div>
                {lockedAchievements.length === 0 ? (
                  <div className="text-white/80 text-sm">
                    You’ve unlocked all available badges. 🙌
                  </div>
                ) : (
                  <TooltipProvider>
                    <div
                      className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                      style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(${badgeMin}px, 1fr))`,
                      }}
                    >
                      {lockedAchievements.map((a: any) => (
                        <BadgeTile
                          key={a.id}
                          badge={a}
                          locked
                          showProgress
                          size={badgeMin}
                          textClass="text-white"
                          progressTextClass="text-white/90"
                        />
                      ))}
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* Solid purple background across the whole app to match Profile */
        body { background: #6214a8 !important; font-family: 'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif !important; }

        .business-hover-underline { transition: color 0.2s; position: relative; }
        .business-hover-underline:hover, .business-hover-underline:focus { color: #6214a8 !important; }
        .business-hover-underline::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px;
          background: #6214a8; border-radius: 1px; opacity: 0; transform: scaleX(0.7);
          transition: opacity 0.18s, transform 0.2s;
        }
        .business-hover-underline:hover::after, .business-hover-underline:focus::after { opacity: 1; transform: scaleX(1); }

        @media (max-width: 400px) {
          .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        .bg-gradient-card { background: linear-gradient(180deg, #ffffff, #faf7ff); }
        .shadow-card { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
        .shadow-soft { box-shadow: 0 10px 28px rgba(0,0,0,0.10); }
      `}</style>
    </div>
  );
};

export default Dashboard;
