import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  ClipboardList,
  Zap,
  Calendar,
  MapPin,
  Share2,
  Lock,
  User,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ===================== Airtable Config ===================== */
const API_KEY =
  "patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e";
const BASE_ID = "appFUJWWTaoJ3YiWt";
const USERS_TABLE = "tblWIFgwTz3Gn3idV";
const REVIEWS_TABLE = "tblef0n1hQXiKPHxI";
const CIRCLES_TABLE = "tbldL8H5T4qYKUzLV";

/* ===================== HTTP helpers ===================== */
const AIRTABLE = axios.create({
  baseURL: `https://api.airtable.com/v0/${BASE_ID}/`,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

function escapeAirtableString(v: string) {
  // Wrap in double quotes and escape embedded double quotes
  return `"${(v || "").replace(/"/g, '\\"')}"`;
}

async function fetchAllPages<T = any>(
  table: string,
  params: Record<string, any>
): Promise<T[]> {
  const out: T[] = [];
  let offset: string | undefined = undefined;
  let safety = 0; // avoid infinite loops
  do {
    const resp = await AIRTABLE.get(table, {
      params: { ...params, offset, pageSize: 100 },
    });
    const records = resp.data?.records || [];
    out.push(...records);
    offset = resp.data?.offset;
    safety++;
  } while (offset && safety < 100);
  return out;
}

/* ===================== Badges ===================== */
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

function getAchievements(
  user: any,
  reviews: any[],
  referralCount: number,
  myReferrals: any[]
) {
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

/* ===================== Utilities ===================== */
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
function formatDate(date?: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
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
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = (phone || "").replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
const digitsOnly = (s = "") => (s || "").toString().replace(/\D/g, "");
const last3 = (s = "") => {
  const d = digitsOnly(s);
  if (!d) return "000";
  return d.slice(-3).padStart(3, "0");
};
async function fetchLast3FromReviews(foundUser: any) {
  // Try by Creator ID, then by Name
  try {
    const idFormula = `{ID (from Creator)}=${escapeAirtableString(foundUser.id || "")}`;
    const byId = await fetchAllPages<any>(REVIEWS_TABLE, { filterByFormula: idFormula });
    let rec = byId[0];

    if (!rec) {
      const nameFormula = `{Name_Creator}=${escapeAirtableString(foundUser.name || "")}`;
      const byName = await fetchAllPages<any>(REVIEWS_TABLE, { filterByFormula: nameFormula });
      rec = byName[0];
    }
    const phone =
      rec?.fields?.ReviewerPhoneNumber ||
      rec?.fields?.Phone ||
      rec?.fields?.["Reviewer Phone Number"] ||
      "";
    return last3(phone);
  } catch {
    return "000";
  }
}

/* Helpers */
function timeAgo(from?: Date | null) {
  if (!from) return "just now";
  const ms = Date.now() - from.getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
  if (h > 0) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  if (m > 0) return m === 1 ? "1 min ago" : `${m} mins ago`;
  return "just now";
}
function toReferralStatus(raw?: string): "clicked" | "reviewed" {
  const s = (raw || "").toLowerCase();
  if (["reviewed", "completed", "done", "posted"].some((k) => s.includes(k)))
    return "reviewed";
  return "clicked";
}
function makeAvatarUrl(name: string) {
  const n = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${n}&size=150&background=random`;
}
function possessive(name: string) {
  if (!name) return "";
  const trimmed = name.trim();
  return trimmed.endsWith("s") || trimmed.endsWith("S") ? `${trimmed}'` : `${trimmed}'s`;
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

/* ===================== Colored stat pills ===================== */
const ColoredStatsTabs = ({
  totalReviews,
  points,
  referralCount,
}: {
  totalReviews: number;
  points: number;
  referralCount: number;
}) => {
  const Pill = ({
    bg,
    ring,
    icon,
    label,
    value,
  }: {
    bg: string;
    ring: string;
    icon: React.ReactNode;
    label: string;
    value: number | string;
  }) => (
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

/* ===== Badge tile (fixed: no stuck tooltips) ===== */
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  const nameColor = textClass || (locked ? "text-gray-800" : "text-white");
  const pct =
    badge.progress && badge.progress.total > 0
      ? Math.min(100, (badge.progress.current / badge.progress.total) * 100)
      : 0;

  // Mobile: close when tapping outside or when scrolling/gesture ends
  useEffect(() => {
    if (!isTouch || !open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isTouch, open]);

  const inner = (
    <div
      ref={rootRef}
      className="cursor-pointer text-center relative"
      style={{ width: size, margin: "0 auto" }}
      onClick={() => isTouch && setOpen((o) => !o)}
      onPointerLeave={() => isTouch && setOpen(false)}
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

      {isTouch && open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-44 rounded-md border bg-white text-gray-800 text-xs shadow-lg px-3 py-2">
          <div className="font-semibold">{badge.name}</div>
          <div className="opacity-80 mt-0.5">{badge.description}</div>
        </div>
      )}
    </div>
  );

  // Desktop hover tooltips (now auto-close cleanly)
  if (isTouch) return inner;

  return (
    <Tooltip delayDuration={100} disableHoverableContent>
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

/* ===== Referral Card ===== */
export interface ReferralData {
  id: string;
  referredPersonName: string;
  businessName: string;
  date: string;
  timeAgo: string;
  status: "clicked" | "reviewed";
  avatarUrl?: string;
}
const ReferralCard = ({ referral }: { referral: ReferralData }) => {
  const navigate = useNavigate();
  const go = () => navigate(`/profile/${slugify(referral.referredPersonName)}`);

  return (
    <div
      className="bg-gradient-card rounded-xl p-4 shadow-card hover:shadow-soft transition-all duration-300 border border-accent/20 cursor-pointer"
      onClick={go}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? go() : null)}
      aria-label={`Open ${referral.referredPersonName}'s profile`}
    >
      <div className="flex items-start gap-3">
        <button onClick={go} className="focus:outline-none" aria-label={`Open ${referral.referredPersonName}'s profile`}>
          <Avatar className="h-10 w-10 border-2 border-accent/30">
            <AvatarImage src={referral.avatarUrl} alt={referral.referredPersonName} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <button onClick={go} className="font-semibold text-foreground truncate hover:underline" title={referral.referredPersonName}>
                {referral.referredPersonName}
              </button>

              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{referral.businessName}</span>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{referral.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===================== Sticky Logo Navbar ===================== */
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

/* ===================== Page ===================== */
const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Reviews" | "Analytics">("Reviews");
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [myReferrals, setMyReferrals] = useState<any[]>([]);
  const [referralsUI, setReferralsUI] = useState<ReferralData[]>([]);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [reviewVotes, setReviewVotes] = useState<{[key: string]: {likes: number, dislikes: number, userLiked?: boolean, userDisliked?: boolean}}>({});

  const isTouch = useIsTouch();
  const badgeMin = isTouch ? 84 : 128;
  
  const handleLike = (reviewIndex: number) => {
  setReviewVotes((prev) => {
    const key = `review-${reviewIndex}`;
    const current = prev[key] || { likes: 0, dislikes: 0 };
    
    if (current.userLiked) {
      return {
        ...prev,
        [key]: { ...current, likes: current.likes - 1, userLiked: false }
      };
    }
    return {
      ...prev,
      [key]: {
        ...current,
        likes: current.likes + 1,
        userLiked: true,
        dislikes: current.userDisliked ? current.dislikes - 1 : current.dislikes,
        userDisliked: false,
      }
    };
  });
};

const handleDislike = (reviewIndex: number) => {
  setReviewVotes((prev) => {
    const key = `review-${reviewIndex}`;
    const current = prev[key] || { likes: 0, dislikes: 0 };
    
    if (current.userDisliked) {
      return {
        ...prev,
        [key]: { ...current, dislikes: current.dislikes - 1, userDisliked: false }
      };
    }
    return {
      ...prev,
      [key]: {
        ...current,
        dislikes: current.dislikes + 1,
        userDisliked: true,
        likes: current.userLiked ? current.likes - 1 : current.likes,
        userLiked: false,
      }
    };
  });
};

  useEffect(() => {
    async function fetchUserAndReviews() {
      setLoading(true);
      try {
        const idParam = (id || "").trim();
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        // 1) Find user by slug of Name; then verify canonical with -last3 suffix
        let foundUser: any = null;

        // Pull all users (paged)
        const users = await fetchAllPages<any>(USERS_TABLE, {});
        const candidates = users.filter((rec: any) => {
          const nm = rec.fields?.Name || "";
          const s = slugify(nm);
          return s === targetBase || s === idParam; // support /name or /name-123 resolving
        });

        for (const rec of candidates) {
                    const name = rec.fields?.Name || "";

          // Build candidate object (includes normalized expert flag)
          const candidate = {
            id: rec.fields?.ID?.toString(),
            airtableId: rec.id,
            name,
            phone: rec.fields?.Phone || "",
            image: Array.isArray(rec.fields?.image)
              ? rec.fields?.image?.[0]?.url
              : rec.fields?.image,
            autogenInvite: rec.fields?.["Autogen Invite"] ?? "",
            bio: rec.fields?.["Bio"] ?? "",
            location: rec.fields?.["Location"] ?? "",
            gender: rec.fields?.["Gender"] || "Male",
          };

          // NEW: read expert flag from Airtable (try common column names) and normalize to boolean
          const expertRaw =
            rec.fields?.Expert ??
            rec.fields?.expert ??
            rec.fields?.["Is Expert"] ??
            rec.fields?.["Expert?"] ??
            rec.fields?.["expert?"] ??
            "";
          const isExpert =
            typeof expertRaw === "boolean"
              ? expertRaw
              : String(expertRaw || "").trim().toLowerCase() === "yes";

          // Attach to candidate for later checks (foundUser will get these fields)
          // candidate.expert = expertRaw;
          // candidate.isExpert = isExpert;

          const baseSlug = slugify(name);
          let l3 = last3(candidate.phone);
          if (!l3 || l3 === "000") {
            // If phone not on Users, try Reviews table
            l3 = await fetchLast3FromReviews({ id: candidate.id, name: candidate.name });
          }
          const canonical = `${baseSlug}-${l3 || "000"}`;
          const isExact = targetSuffix ? canonical === idParam : baseSlug === targetBase;
        }
        
        // --- Replace existing redirect-check with this ---
        if (foundUser) {
          // Redirect to expert page if this user is an expert (normalized boolean)
          if (foundUser.isExpert) {
            navigate(`/expert/${foundUser.canonicalSlug}`, { replace: true });
            return; // Prevent further execution so we don't fetch normal profile data
          }

          const currentIsCanonical = idParam === foundUser.canonicalSlug;
          if (!currentIsCanonical) {
            navigate(`/profile/${foundUser.canonicalSlug}`, { replace: true });
          }
        }
        // --- end replacement ---

        setUser(foundUser);
        

        // 2) Reviews for user (by Creator ID, then by Name fallback) — fully paged
        let allReviews: any[] = [];
        if (foundUser) {
          const byIdFormula = `{ID (from Creator)}=${escapeAirtableString(foundUser.id || "")}`;
          const byId = await fetchAllPages<any>(REVIEWS_TABLE, {
            filterByFormula: byIdFormula,
          });
          allReviews = allReviews.concat(byId);

          if (allReviews.length === 0) {
            const byNameFormula = `{Name_Creator}=${escapeAirtableString(foundUser.name || "")}`;
            const byName = await fetchAllPages<any>(REVIEWS_TABLE, {
              filterByFormula: byNameFormula,
            });
            allReviews = allReviews.concat(byName);
          }

          const validReviews = allReviews
            .filter(
              (r: any) =>
                !!r.fields?.business_name &&
                !!r.fields?.Uplaud &&
                typeof r.fields?.["Uplaud Score"] === "number"
            )
            .map((r: any) => ({
              businessName: r.fields.business_name,
              uplaud: r.fields.Uplaud,
              date: r.fields.Date_Added ? new Date(r.fields.Date_Added) : null,
              score: r.fields["Uplaud Score"],
              shareLink: r.fields["Share Link"] || "",
              referralLink: r.fields["ReferralLink"] || r.fields["Referral Link"] || "",
              location: r.fields.City || "",
              category: r.fields.Category || "Other",
            }))
            .sort((a, b) => {
              const at = a.date ? a.date.getTime() : 0;
              const bt = b.date ? b.date.getTime() : 0;
              return bt - at;
            });
          setReviews(validReviews);
        } else {
          setReviews([]);
        }

        // 3) Referrals for user (Initiator = user.name), paged, dedup latest per receiver+business
        let unique = new Map<
          string,
          { receiver: string; business: string; status: "clicked" | "reviewed"; date: Date | null }
        >();
        let rawForBadges: any[] = [];

        if (foundUser && foundUser.name) {
          const circles = await fetchAllPages<any>(CIRCLES_TABLE, {
            filterByFormula: `{Initiator}=${escapeAirtableString(foundUser.name)}`,
          });

          for (const c of circles) {
            const receivers = Array.isArray(c.fields?.Receiver)
              ? c.fields?.Receiver
              : [c.fields?.Receiver];
            const business = c.fields?.["Business_Name"] || "";
            const rawStatus = c.fields?.["ReviewStatus"] || c.fields?.["ReferralStatus"] || "Delivered";
            const status = toReferralStatus(rawStatus);
            const date: Date | null = c.fields?.["Date_Added"]
              ? new Date(c.fields?.["Date_Added"])
              : null;

            for (const r of receivers) {
              if (!r || !business) continue;
              const key = `${r}||${business}`;
              const prev = unique.get(key);
              if (
                !prev ||
                (date && prev.date && date.getTime() > prev.date.getTime()) ||
                (!prev.date && date)
              ) {
                unique.set(key, { receiver: r, business, status, date });
              }
              rawForBadges.push({ receiver: r, business, status, date });
            }
          }
        }

        setReferralCount(unique.size);
        setMyReferrals(rawForBadges);

        const ui: ReferralData[] = Array.from(unique.values())
          .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
          .map((item, i) => ({
            id: `${i + 1}`,
            referredPersonName: item.receiver,
            businessName: item.business,
            date: item.date ? formatDate(item.date) : "",
            timeAgo: timeAgo(item.date),
            status: item.status,
            avatarUrl: makeAvatarUrl(item.receiver),
          }));
        setReferralsUI(ui);
      } catch {
        setUser(null);
        setReviews([]);
        setReferralCount(0);
        setMyReferrals([]);
        setReferralsUI([]);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchUserAndReviews();
  }, [id, navigate]);

  // Stats
  const pointsPerReview = 10;
  const pointsPerReferral = 20;
  const totalReviews = reviews.length;
  const pointsFromReviews = totalReviews * pointsPerReview;
  const pointsFromReferrals = referralCount * pointsPerReferral;
  const points = pointsFromReviews + pointsFromReferrals;

  const joinDate =
    reviews.length > 0 && reviews[reviews.length - 1].date
      ? formatDate(reviews[reviews.length - 1].date)
      : "—";

  // Achievements
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedAchievements = achievements.filter((a) => a.isEarned);
  const lockedAchievements = achievements.filter((a) => !a.isEarned);

  // Points breakdown – reviews only (no referral inner list)
  const reviewBreakdownItems = reviews.slice(0, 10).map((r) => ({
    label: `Review: ${r.businessName}`,
    when: r.date ? formatDate(r.date) : "",
  }));

  const handleShareProfileToWhatsAppOnly = () => {
    if (!user) return;
    const wa = getWhatsAppShareLink(user);
    window.open(wa, "_blank");
  };

  // Accordion UI state
  const [openReviewsPB, setOpenReviewsPB] = useState(true);
  const [openRefPB, setOpenRefPB] = useState(true);

  /** ========= REVIEW CARD ========= */
  function ReviewCardLocal({ review, index }: { review: any; index: number }) {
  if (!review.businessName || !review.uplaud) return null;

  const voteKey = `review-${index}`;
  const votes = reviewVotes[voteKey] || { likes: 0, dislikes: 0 };

  const handleShare = () => {
    const link =
      review.referralLink ||
      review.shareLink ||
      `${window.location.origin}/business/${slugify(review.businessName)}`;

    const message = `Hey, check out this Real Review for ${review.businessName} on Uplaud. It's a platform where real people give honest reviews on WhatsApp:\n${link}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.location.href = wa;
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

          {/* Desktop meta */}
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
              onClick={handleShare}
              className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-transparent focus:bg-transparent border-0 shadow-none"
              aria-label="Share this review on WhatsApp"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile meta */}
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

          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-transparent focus:bg-transparent border-0 shadow-none"
            aria-label="Share this review on WhatsApp"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
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

      {/* Helpful section */}
      <div className="px-5 py-4 flex items-center gap-4">
        <span className="text-sm text-gray-600">Was this helpful?</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLike(index)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              votes.userLiked
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700 hover:bg-green-50"
            }`}
            aria-label="Like this review"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{votes.likes}</span>
          </button>
          <button
            onClick={() => handleDislike(index)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              votes.userDisliked
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-red-50"
            }`}
            aria-label="Dislike this review"
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-semibold">{votes.dislikes}</span>
          </button>
        </div>
      </div>
    </div>
  );
  }
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

  // Points totals
  const totalPoints = points;

  return (
    <div
      className="min-h-screen w-full font-sans text-gray-800 relative"
      style={{
        background: "transparent",
        fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif`,
      }}
    >
      <StickyLogoNavbar />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 px-2 sm:px-0 pt-24">
        {/* Back */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => navigate("/leaderboard")}
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

        {/* Profile Card */}
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

            {/* Name/handle + mobile share */}
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

                <button
                  onClick={handleShareProfileToWhatsAppOnly}
                  className="sm:hidden shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-2 shadow"
                  aria-label="Share profile"
                  title="Share Profile"
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

            {/* Desktop share */}
            <button
              onClick={handleShareProfileToWhatsAppOnly}
              className="hidden sm:flex items-center justify-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow"
              title="Share Profile"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)" }}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <ColoredStatsTabs
            totalReviews={reviews.length}
            points={totalPoints}
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
              <TooltipProvider delayDuration={100}>
                <div
                  className="gap-3 grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${badgeMin}px, 1fr))`,
                  }}
                >
                  {earnedAchievements.map((a) => (
                    <BadgeTile key={a.id} badge={a} size={badgeMin} />
                  ))}
                </div>
              </TooltipProvider>
            )}
          </div>
        </Card>

        {/* Tabs container */}
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
                        <ReviewCardLocal key={idx} review={review} index={idx} />
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
              {/* Points Breakdown – no "Activity" title, no referral inner list */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                <div className="rounded-xl p-3 bg-white/90 backdrop-blur border shadow-sm overflow-hidden box-border">
                  <div className="text-sm text-gray-800 font-semibold mb-2"></div>

                  <div className="text-gray-900 text-sm mb-2">
                    <div>
                      Total Points: <span className="font-bold">{totalPoints}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      (10 points per review, 20 points per successful referral)
                    </div>
                  </div>

                  {/* Reviews accordion */}
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

                  {/* Referrals accordion – only totals */}
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
                  </div>
                </div>
              </div>

              {/* Username’s Referrals */}
              <h3 className="text-base font-semibold text-white mb-3">
                {user?.name ? `${possessive(user.name)} Referrals` : "Referrals"}
              </h3>
              <div className="space-y-3 mb-4">
                {referralsUI.length === 0 ? (
                  <div className="text-white/80">No referrals yet.</div>
                ) : (
                  (showAllReferrals ? referralsUI : referralsUI.slice(0, 5)).map(
                    (r) => <ReferralCard key={r.id} referral={r} />
                  )
                )}
              </div>
              {referralsUI.length > 5 && (
                <div className="flex justify-center mb-8">
                  <button
                    className="px-5 py-2 rounded-lg bg-white/15 text-white font-bold hover:bg-white/25 shadow transition"
                    onClick={() => setShowAllReferrals((v) => !v)}
                  >
                    {showAllReferrals ? "Show Less" : "Load More Referrals"}
                  </button>
                </div>
              )}

              {/* Badge Goals */}
              <div className="mb-2">
                <div className="font-semibold text-white mb-2">Badge Goals</div>
                {lockedAchievements.length === 0 ? (
                  <div className="text-white/80 text-sm">
                    You’ve unlocked all available badges. 🙌
                  </div>
                ) : (
                  <TooltipProvider delayDuration={100}>
                    <div
                      className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                      style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(${badgeMin}px, 1fr))`,
                      }}
                    >
                      {lockedAchievements.map((a) => (
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
        /* Solid purple background across the whole page */
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

export default ProfilePage;
