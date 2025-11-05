import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Share2,
  ArrowLeft,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  Award,
  Linkedin,
  Instagram,
  Globe,
} from "lucide-react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// import { Card } from "@/components/ui/card";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

function getDisplayFromUrl(url?: string) {
  if (!url) return "";
  try {
    // If user provided a plain handle (no protocol), show as-is
    if (!/^https?:\/\//i.test(url)) {
      // If it starts with @ return as-is
      return url;
    }
    const u = new URL(url);
    const segs = (u.pathname || "").replace(/\/+$/g, "").split("/").filter(Boolean);
    const lastSeg = segs.length ? segs[segs.length - 1] : "";
    // Return last path segment (username) if present, otherwise hostname
    return lastSeg || u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
          <a href="/" className="flex items-center">
            <img
              alt="Uplaud Logo"
              className="h-10 w-auto object-fill"
              src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png"
            />
          </a>
          <div className="w-10 h-10" />
        </div>
      </div>
    </nav>
  );
}

/* ===================== Colored stat pills ===================== */
const ColoredStatsTabs = ({
  rating,
  recommendations,
  followers,
}: {
  rating: number;
  recommendations: number;
  followers: number;
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
        label="Rating"
        value={rating.toFixed(1)}
      />
      <Pill
        bg="bg-violet-50 text-violet-800"
        ring="ring-1 ring-violet-200"
        icon={<Award className="w-3 h-3" />}
        label="Recommendations"
        value={recommendations}
      />
      <Pill
        bg="bg-rose-50 text-rose-800"
        ring="ring-1 ring-rose-200"
        icon={<Users className="w-3 h-3" />}
        label="Followers"
        value={followers.toLocaleString()}
      />
    </div>
  );
};

/* ===================== Recommendation Card ===================== */
interface Recommendation {
  id: string;
  productName: string;
  category: string;
  rating: number;
  date: Date;
  description: string;
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
}

const RecommendationCard = ({
  recommendation,
  onLike,
  onDislike,
}: {
  recommendation: Recommendation;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const descriptionLimit = 200;
  const needsTruncation = recommendation.description.length > descriptionLimit;
  const displayText = showFullText
    ? recommendation.description
    : recommendation.description.slice(0, descriptionLimit);

  const handleShare = () => {
    const message = `Check out this recommendation from an expert: ${recommendation.productName}`;
    const url = window.location.href;
    const wa = `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
    window.location.href = wa;
  };

  return (
    <div
      className="flex flex-col rounded-2xl shadow transition hover:shadow-xl overflow-hidden"
      style={{ background: "#FFF7E6" }}
    >
      <div className="w-full px-5 pt-5">
        {/* Title row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-base sm:text-lg text-black break-words">
              {recommendation.productName}
            </h3>
            <p className="text-sm text-purple-700 font-medium mt-1">
              {recommendation.category}
            </p>
          </div>

          {/* Desktop meta */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center leading-none">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="text-lg font-bold">{recommendation.rating}</span>
            </span>

            <span className="text-gray-500 text-xs sm:text-sm font-medium">
              {formatDate(recommendation.date)}
            </span>

            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-gray-100 transition"
              aria-label="Share this recommendation"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Mobile meta */}
        <div className="sm:hidden mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="text-base font-bold">{recommendation.rating}</span>
            </span>
            <span className="text-gray-600 text-xs font-medium">
              {formatDate(recommendation.date)}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center rounded-md p-2"
            aria-label="Share this recommendation"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Recommendation body */}
      <div className="mt-3 w-full">
        <div
          className="w-full px-5 py-4 text-gray-900 text-base font-medium break-words"
          style={{ background: "#DCF8C6" }}
        >
          <span style={{ display: "block", wordBreak: "break-word" }}>
            {displayText}
            {needsTruncation && !showFullText && "..."}
          </span>
          {needsTruncation && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-purple-700 hover:text-purple-900 text-sm font-semibold mt-2 underline"
            >
              {showFullText ? "See Less" : "See More"}
            </button>
          )}
        </div>
      </div>

      {/* Helpful section */}
      <div className="px-5 py-4 flex items-center gap-4">
        <span className="text-sm text-gray-600">Was this helpful?</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(recommendation.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              recommendation.userLiked
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700 hover:bg-green-50"
            }`}
            aria-label="Like this recommendation"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{recommendation.likes}</span>
          </button>
          {/* <button
            onClick={() => onDislike(recommendation.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              recommendation.userDisliked
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-red-50"
            }`}
            aria-label="Dislike this recommendation"
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-semibold">{recommendation.dislikes}</span>
          </button> */}
        </div>
      </div>
    </div>
  );
};

/* ===================== Page ===================== */
const ExpertProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expert, setExpert] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  // const [recommendations, setRecommendations] = useState<Recommendation[]>([ ... ]);

  const [activeTab, setActiveTab] = useState<"Recommendations" | "Activity">(
    "Recommendations"
  );
  const [showFullBio, setShowFullBio] = useState(false);

  const handleLike = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        if (rec.userLiked) {
          return { ...rec, likes: rec.likes - 1, userLiked: false };
        }
        return {
          ...rec,
          likes: rec.likes + 1,
          userLiked: true,
          dislikes: rec.userDisliked ? rec.dislikes - 1 : rec.dislikes,
          userDisliked: false,
        };
      })
    );
  };

  const handleDislike = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        if (rec.userDisliked) {
          return { ...rec, dislikes: rec.dislikes - 1, userDisliked: false };
        }
        return {
          ...rec,
          dislikes: rec.dislikes + 1,
          userDisliked: true,
          likes: rec.userLiked ? rec.likes - 1 : rec.likes,
          userLiked: false,
        };
      })
    );
  };

  useEffect(() => {
    async function fetchExpertAndRecommendations() {
      setLoading(true);
      try {
        // 1. Find expert user from USERS_TABLE (not experts table)
        const idParam = (id || "").trim();
        const users = await fetchAllPages<any>(USERS_TABLE, {});
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        // Find by slug or id
        let foundExpert: any = null;
        for (const rec of users) {
          const name = rec.fields?.Name || "";
          const baseSlug = slugify(name);
          let l3 = last3(rec.fields?.Phone || "");
          if (l3 === "000") {
            // fallback: try to obtain from reviews if needed
            // optional: you can enable this if many users lack phone
            // l3 = await fetchLast3FromReviews({ id: rec.fields?.ID?.toString(), name });
          }
          const canonical = `${baseSlug}-${l3 || "000"}`;
          const isExact = targetSuffix ? canonical === idParam : baseSlug === targetBase;

          // Read the exact "Expert" column and normalize to boolean:
          // Accept numeric 1, string "1", or boolean true as expert.
          const expertRaw = rec.fields?.Expert;
          const isExpert =
            typeof expertRaw === "number"
              ? expertRaw === 1
              : typeof expertRaw === "boolean"
              ? expertRaw
              : String(expertRaw ?? "").trim() === "1";

          if (isExact && isExpert) {
            // build full expert object with more fields (match ProfilePage)
            foundExpert = {
              id: rec.fields?.ID?.toString(),
              airtableId: rec.id,
              name,
              phone: rec.fields?.Phone || "",
              autogenInvite: rec.fields?.["Autogen Invite"] ?? "",
              bio: rec.fields?.bio ?? rec.fields?.Bio ?? "",
              fullBio:
                rec.fields?.About ??
                "",
              location: rec.fields?.Location ?? rec.fields?.location ?? "",
              gender: rec.fields?.Gender || rec.fields?.gender || "Male",
              isVerified: !!rec.fields?.verified,
              // rating and recommendationsCount we'll compute from reviews if not present
              rating: typeof rec.fields?.rating === "number" ? rec.fields?.rating : 0,
              recommendationsCount:
                typeof rec.fields?.recommendationsCount === "number"
                  ? rec.fields?.recommendationsCount
                  : 0,
              followers: rec.fields?.followers || 0,
              image: Array.isArray(rec.fields?.image)
                ? rec.fields?.image[0]?.url
                : rec.fields?.image,
              linkedin:
                rec.fields?.["LinkedIn Profile"] ??
                "",
              instagram:
                rec.fields?.["Instagram Profile"] ??
                "",
                expert: rec.fields?.Expert ??"",
            };
            break;
          }
        }

        if (!foundExpert) {
          setExpert(null);
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // 2. Fetch recommendations (reviews) for this expert using REVIEWS_TABLE.
        // Use Creator ID (field name used in your reviews) — mirror ProfilePage logic.
        const recs = await fetchAllPages<any>(REVIEWS_TABLE, {
          filterByFormula: `{ID (from Creator)}=${escapeAirtableString(foundExpert.id || "")}`,
        });

        // If no reviews found by ID, fallback to Name_Creator lookup (same as ProfilePage)
        let allRecs = recs;
        if (!allRecs || allRecs.length === 0) {
          const byName = await fetchAllPages<any>(REVIEWS_TABLE, {
            filterByFormula: `{Name_Creator}=${escapeAirtableString(foundExpert.name || "")}`,
          });
          allRecs = byName;
        }

        const mappedRecs: Recommendation[] = (allRecs || [])
          .map((r: any) => ({
            id: r.id,
            productName: r.fields.business_name || r.fields?.BusinessName || "",
            category: r.fields.Category || r.fields?.category || "Other",
            rating: typeof r.fields["Uplaud Score"] === "number" ? r.fields["Uplaud Score"] : (r.fields?.rating || 0),
            date: r.fields.Date_Added ? new Date(r.fields.Date_Added) : r.fields?.Date ? new Date(r.fields?.Date) : null,
            description: r.fields.Uplaud || r.fields?.Review || r.fields?.Description || "",
            likes: r.fields.Likes || 0,
            dislikes: r.fields.Dislikes || 0,
          }))
          .filter((r) => !!r.productName && !!r.description);
          // Sort mappedRecs by date (newest first)
          const sortedRecs = mappedRecs.slice().sort((a, b) => {
            const at = a.date ? a.date.getTime() : 0;
            const bt = b.date ? b.date.getTime() : 0;
            return bt - at;
          });
        // Compute rating average from mapped reviews if we didn't get rating from the user record
        let rating = foundExpert.rating || 0;
        if ((!rating || rating === 0) && mappedRecs.length > 0) {
          const sum = mappedRecs.reduce((s, x) => s + (x.rating || 0), 0);
          rating = sum / mappedRecs.length;
        }

        const recommendationsCount = mappedRecs.length || foundExpert.recommendationsCount || 0;

        // Compute joinDate same as ProfilePage: earliest review date (i.e. last element after descending sort)
        const joinDate =
          sortedRecs.length > 0 && sortedRecs[sortedRecs.length - 1].date
            ? formatDate(sortedRecs[sortedRecs.length - 1].date)
            : "—";

        // Attach computed values to expert object
        const expertWithData = {
          ...foundExpert,
          rating: rating || 0,
          recommendationsCount,
        };

        setExpert(expertWithData);
        setRecommendations(sortedRecs);

      } catch (err) {
        console.error("Error loading expert:", err);
        setExpert(null);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchExpertAndRecommendations();
  }, [id]);

  const handleFollow = () => {
    // Implement follow functionality
    console.log("Follow clicked");
  };

  const handleShare = () => {
    const message = `Check out ${expert.name}'s profile on Uplaud`;
    const url = window.location.href;
    const wa = `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
    window.location.href = wa;
  };

  if (loading) {
    return (
      <>
        <StickyLogoNavbar />
        <div className="flex justify-center items-center h-80 text-lg text-white pt-20">
          Loading…
        </div>
      </>
    );
  }
  if (!expert)
    return (
      <>
        <StickyLogoNavbar />
        <div className="min-h-screen flex items-center justify-center text-white pt-20">
          Expert not found.
        </div>
      </>
    );
  return (
    <div
      className="min-h-screen w-full font-sans text-gray-800 relative"
      style={{
        background: "#6214a8",
        fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif`,
      }}
    >
      <StickyLogoNavbar />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 px-2 sm:px-0 pt-24">
        {/* Back Button */}
        <div className="flex items-center justify-start">
          <button
            onClick={() => navigate(-1)}
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

        {/* Expert Profile Card */}
        <div
          className="shadow-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-5 border mt-2"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-purple-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white select-none mb-4">
              {expert?.image ? (
                <img
                  src={expert.image}
                  alt={expert?.name || "Expert"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                expert?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
              )}
            </div>

                        {/* Name, Join Date, Actions, Social Links */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="font-extrabold text-2xl sm:text-3xl">{expert?.name}</h2>
                {expert?.isVerified && (
                  <CheckCircle className="w-6 h-6 text-green-600 fill-green-600" />
                )}
              </div>

              {/* Join date (small line under name) */}
              <div className="text-sm text-gray-700 mb-3">
                Joined {expert?.joinDate ?? "—"}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-3">
                <Button
                  onClick={handleFollow}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Follow
                </Button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-50"
                  style={{ background: "rgba(255,255,255,0.9)" }}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Social links row (icons + compact label) */}
              <div className="flex items-center gap-4 text-sm text-gray-800 mb-3">
                {expert?.linkedin ? (
                  <a
                    href={expert.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                    title={expert.linkedin}
                  >
                    <Linkedin className="w-4 h-4 text-gray-800" />
                    <span className="truncate" style={{ maxWidth: 220 }}>
                      {getDisplayFromUrl(expert.linkedin)}
                    </span>
                  </a>
                ) : null}

                {expert?.instagram ? (
                  <a
                    href={expert.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                    title={expert.instagram}
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="truncate" style={{ maxWidth: 220 }}>
                      {getDisplayFromUrl(expert.instagram)}
                    </span>
                  </a>
                ) : null}

                {expert?.website ? (
                  <a
                    href={expert.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                    title={expert.website}
                  >
                    <Globe className="w-4 h-4 text-gray-700" />
                    <span className="truncate" style={{ maxWidth: 220 }}>
                      {getDisplayFromUrl(expert.website)}
                    </span>
                  </a>
                ) : null}
              </div>

              {/* Credentials (kept below socials) */}
              {expert?.credentials && (
                <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">
                  {expert.credentials}
                </p>
              )}

              {/* Short bio */}
              {expert?.bio && (
                <p className="text-sm sm:text-base text-gray-600 mb-2">{expert?.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <ColoredStatsTabs
            rating={expert.rating}
            recommendations={expert.recommendationsCount}
            followers={expert.followers}
          />
        </div>

        {/* About Section */}
        <Card
          className="w-full backdrop-blur-md p-5"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
          <p className="text-gray-700 text-base">
            {showFullBio
              ? expert.fullBio
              : expert.fullBio.slice(0, 150) +
                (expert.fullBio.length > 150 ? "..." : "")}
            {expert.fullBio.length > 150 && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-purple-700 hover:text-purple-900 font-semibold ml-1"
              >
                {showFullBio ? "See Less" : "See More"}
              </button>
            )}
          </p>
        </Card>

        {/* Tabs */}
        <div className="rounded-2xl p-4" style={{ background: "transparent" }}>
          <div className="flex gap-6 mb-6 text-base font-semibold border-b border-white/30">
            <button
              className={`pb-2 -mb-[2px] px-1 transition ${
                activeTab === "Recommendations"
                  ? "text-white border-b-2 border-white"
                  : "text-white/80 hover:text-white"
              }`}
              onClick={() => setActiveTab("Recommendations")}
            >
              Recommendations
            </button>
            <button
              className={`pb-2 -mb-[2px] px-1 transition ${
                activeTab === "Activity"
                  ? "text-white border-b-2 border-white"
                  : "text-white/80 hover:text-white"
              }`}
              onClick={() => setActiveTab("Activity")}
            >
              Activity
            </button>
          </div>

          {activeTab === "Recommendations" && (
            <div>
              {recommendations.length === 0 ? (
                <div className="text-center text-white/90 py-8">
                  No recommendations yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onLike={handleLike}
                      onDislike={handleDislike}
                    />
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-sm text-center italic">
                  These recommendations are for informational purposes only and not a
                  substitute for medical advice.
                </p>
              </div>
            </div>
          )}

          {activeTab === "Activity" && (
            <div className="text-center text-white/90 py-8">
              Activity timeline coming soon...
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        body {
          background: #6214a8 !important;
          font-family: 'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default ExpertProfile;