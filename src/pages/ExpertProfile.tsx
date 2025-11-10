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
  Search,
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

/**
 * Return a compact label for UI from a social URL or handle:
 * - If value is a URL, return last meaningful path segment or hostname.
 * - If it's a handle like '@name' return as-is.
 * - If it's a path like 'in/username' return the last segment.
 */

function ensureProtocol(url: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildSocialHref(provider: "linkedin" | "instagram" | "website", raw?: string) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;

  // If full URL already provided, ensure it has protocol
  if (/^https?:\/\//i.test(v)) return ensureProtocol(v);

  // If it looks like a domain (contains a dot) assume website-like and add protocol
  if (provider === "website" || /\./.test(v)) return ensureProtocol(v);

  if (provider === "linkedin") {
    // possible inputs: "in/username", "/in/username", "username", "https://linkedin.com/in/username"
    const path = v.replace(/^\/+/, ""); // remove leading slashes
    // if user provided something like 'linkedin.com/in/xyz', just add protocol
    if (path.toLowerCase().includes("linkedin.com")) return ensureProtocol(path);
    return `https://www.linkedin.com/${path}`;
  }

  if (provider === "instagram") {
    // inputs: "@username", "username", "/username", "instagram.com/username"
    const withoutAt = v.startsWith("@") ? v.slice(1) : v.replace(/^\/+/, "");
    if (withoutAt.toLowerCase().includes("instagram.com")) return ensureProtocol(withoutAt);
    return `https://www.instagram.com/${withoutAt}`;
  }

  // fallback — treat as website
  return ensureProtocol(v);
}

function getDisplayFromUrl(url?: string) {
  if (!url) return "";
  const v = String(url).trim();
  try {
    // If not a URL, show a compact version of the raw value
    if (!/^https?:\/\//i.test(v)) {
      if (v.startsWith("@")) return v; // show @handle
      const parts = v.replace(/\/+$/g, "").split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : v;
    }
    const u = new URL(ensureProtocol(v));
    const segs = (u.pathname || "").replace(/\/+$/g, "").split("/").filter(Boolean);
    return segs.length ? segs[segs.length - 1] : u.hostname.replace(/^www\./, "");
  } catch {
    return v;
  }
}

// REPLACE the existing normalizeVideoUrl with this block (paste into the utilities area,
// next to ensureProtocol / getDisplayFromUrl).

/** Extract YouTube video id from many common YouTube URL shapes */
function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = url.trim();
    // youtu.be/ID
    const m1 = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
    if (m1 && m1[1]) return m1[1];
    // youtube.com/watch?v=ID or youtube.com/embed/ID
    const m2 = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i) || u.match(/\/embed\/([A-Za-z0-9_-]{6,})/i);
    if (m2 && m2[1]) return m2[1];
    return null;
  } catch {
    return null;
  }
}

/** Return a best-effort YouTube thumbnail url (maxresfallback -> hqdefault) */
function getYouTubeThumbnail(url?: string): string | null {
  const id = getYouTubeId(url || "");
  if (!id) return null;
  // maxresdefault may not exist for all videos; UI will still show image URL; browser will fallback to broken image
  // We use maxresdefault first and fall back to hqdefault when necessary by using a second check in code if you like.
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

/** Extract Google Drive file id from common Drive link forms. */
function getDriveFileId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = url.trim();
    // patterns: /file/d/ID/, open?id=ID, drive.google.com/drive/folders/ID (folders not embeddable)
    const m1 = u.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/);
    if (m1 && m1[1]) return m1[1];
    const m2 = u.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
    if (m2 && m2[1]) return m2[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize various Airtable/field shapes into a usable video URL string or null.
 * - Accepts attachment arrays, attachment objects, or plain strings.
 * - Recognizes YouTube and Google Drive links and returns a canonical URL that can be embedded.
 */
function normalizeVideoUrl(raw?: any): string | null {
  if (!raw || (typeof raw === "string" && raw.trim() === "")) return null;


  // 1) If Airtable attachment array: take first file url
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && typeof first === "object" && first.url) {
      return ensureProtocol(String(first.url).trim());
    }
    if (typeof raw[0] === "string" && raw[0].trim()) {
      return ensureProtocol(raw[0].trim());
    }
    return null;
  }

  // 2) If object with url property
  if (typeof raw === "object") {
    if (raw.url && String(raw.url).trim()) return ensureProtocol(String(raw.url).trim());
    // guard for nested shapes
    if (raw.fields && raw.fields.url && String(raw.fields.url).trim()) return ensureProtocol(String(raw.fields.url).trim());
    return null;
  }

  // 3) If string - try to normalize:
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;

    // If it's a YouTube id/path like "in/username" unlikely for video; check full URL patterns
    // If it already includes youtube or youtu.be -> return canonical https watch link
    const ytId = getYouTubeId(s);
    if (ytId) {
      // return canonical watch URL (we will convert to embed later)
      return `https://www.youtube.com/watch?v=${ytId}`;
    }

    // Check Google Drive file id -> return preview URL for embedding
    const driveId = getDriveFileId(s);
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }

    // If it looks like a URL (contains dot or protocol), ensure protocol and return
    if (/^https?:\/\//i.test(s) || /\./.test(s)) {
      return ensureProtocol(s);
    }

    // Otherwise not a usable video link
    return null;
  }

  return null;
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
  videoUrl?: string;
  thumbnail?: string;
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "video" | "text">("all");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

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
              website:
                rec.fields?.Website ??
                rec.fields?.["Website URL"] ??
                rec.fields?.["Personal Website"] ??
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

        // Replace existing mapping with this version that normalizes videoUrl and thumbnail
        // REPLACE the mappedRecs mapping inside fetchExpertAndRecommendations() with this block

        const mappedRecs: Recommendation[] = (allRecs || [])
          .map((r: any) => {
            // prefer VideoURL field (attachment or string)
            const rawVideo =
              r.fields?.VideoURL ??
              r.fields?.Video ??
              r.fields?.["Video URL"] ??
              r.fields?.["Share Link"] ??
              r.fields?.["ShareLink"];

            const normalizedVideo = normalizeVideoUrl(rawVideo); // string or null

            // normalize thumbnail: attachments array or URL string
            let thumb: string | null = null;
            if (Array.isArray(r.fields?.Thumbnail) && r.fields.Thumbnail[0]?.url) {
              thumb = r.fields.Thumbnail[0].url;
            } else if (Array.isArray(r.fields?.thumbnail) && r.fields?.thumbnail[0]?.url) {
              thumb = r.fields.thumbnail[0].url;
            } else if (typeof r.fields?.thumbnail === "string" && r.fields.thumbnail.trim()) {
              thumb = r.fields.thumbnail.trim();
            } else if (typeof r.fields?.ThumbnailUrl === "string" && r.fields.ThumbnailUrl.trim()) {
              thumb = r.fields.ThumbnailUrl.trim();
            } else if (typeof r.fields?.["Thumbnail URL"] === "string" && r.fields?.["Thumbnail URL"].trim()) {
              thumb = r.fields["Thumbnail URL"].trim();
            }

            // If no thumbnail provided but we have a YouTube URL, use YouTube thumbnail
            if (!thumb && normalizedVideo) {
              const ytId = getYouTubeId(normalizedVideo);
              if (ytId) {
                thumb = getYouTubeThumbnail(normalizedVideo);
              }
            }

            return {
              id: r.id,
              productName: r.fields.business_name || r.fields?.BusinessName || "",
              category: r.fields.Category || r.fields?.category || "Other",
              rating:
                typeof r.fields["Uplaud Score"] === "number"
                  ? r.fields["Uplaud Score"]
                  : r.fields?.rating || 0,
              date: r.fields.Date_Added
                ? new Date(r.fields.Date_Added)
                : r.fields?.Date
                ? new Date(r.fields?.Date)
                : null,
              description:
                r.fields.Uplaud || r.fields?.Review || r.fields?.Description || "",
              likes: r.fields.Likes || 0,
              dislikes: r.fields.Dislikes || 0,
              // normalized videoUrl (string or null)
              videoUrl: (() => {
                if (!normalizedVideo) return null;
                const ytId = getYouTubeId(normalizedVideo);
                const driveId = getDriveFileId(normalizedVideo);
                return ytId || driveId ? normalizedVideo : null;
              })(),
              thumbnail: thumb || "",
            };
          })
          .filter((r) => !!r.productName && !!r.description);  // Sort mappedRecs by date (newest first)
          
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
          joinDate,
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

  const filteredRecommendations = (recommendations || []).filter((rec) => {
  // filter by video/text/all
  if (reviewFilter === "video" && !rec.videoUrl) return false;
  if (reviewFilter === "text" && rec.videoUrl) return false;

  const term = (searchTerm || "").trim().toLowerCase();
  if (!term) return true;

  // search on productName, description, category, rating
  const hay = [
    rec.productName,
    rec.description,
    rec.category,
    rec.rating?.toString(),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(term);
});

// videos used for carousel: records that have videoUrl and match search term
const videoItems = (recommendations || [])
  .filter((r) => r.videoUrl && r.videoUrl.trim() !== "")
  .filter((r) => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return true;
    const hay = [r.productName, r.description].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(term);
  })
  .map((r) => ({
    id: r.id,
    businessName: r.productName,
    videoUrl: r.videoUrl,
    thumbnail: r.thumbnail || "",
  }));

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
                    href={buildSocialHref("linkedin", expert.linkedin) || undefined}
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
                    href={buildSocialHref("instagram", expert.instagram) || undefined}
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
                    href={buildSocialHref("website", expert.website) || undefined}
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
              {/* Video Carousel (shows when there are videos) */}
              {videoItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">Video Reviews</div>
                    <div className="text-sm text-white/80">{videoItems.length} video{videoItems.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto py-2">
                    {videoItems.map((v) => (
                      <button
                        key={v.id}
                        onClick={() =>
                          setSelectedVideo({
                            videoUrl: v.videoUrl,
                            businessName: v.businessName,
                            thumbnail: v.thumbnail,
                          })
                        }
                        className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm"
                        style={{ minWidth: 220 }}
                        aria-label={`Play ${v.businessName}`}
                      >
                        <div
                          className="w-[220px] h-[120px] bg-gray-100 flex items-center justify-center"
                          style={{
                            backgroundImage: v.thumbnail ? `url(${v.thumbnail})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        <div className="p-2 bg-white/90 text-sm text-gray-800">{v.businessName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter bar + Search */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewFilter("all")}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      reviewFilter === "all" ? "bg-white text-purple-700" : "bg-white/10 text-white/80"
                    }`}
                  >
                    All Reviews
                  </button>
                  <button
                    onClick={() => setReviewFilter("video")}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      reviewFilter === "video" ? "bg-white text-purple-700" : "bg-white/10 text-white/80"
                    }`}
                  >
                    🎥 Video Only
                  </button>
                  <button
                    onClick={() => setReviewFilter("text")}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      reviewFilter === "text" ? "bg-white text-purple-700" : "bg-white/10 text-white/80"
                    }`}
                  >
                    📝 Text Only
                  </button>
                </div>

                {/* Search box aligned to right */}
                <div className="ml-auto flex items-center gap-2 max-w-md w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-white/80" />
                    </span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search reviews or keywords…"
                      className="w-full pl-10 pr-3 py-2 rounded-full bg-white/90 text-sm shadow-sm focus:outline-none"
                    />
                  </div>
                  <div className="hidden sm:block text-sm text-white/80">
                    {filteredRecommendations.length} result{filteredRecommendations.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Reviews list (text / mixed) */}
              <div className="space-y-6">
                {filteredRecommendations.length === 0 ? (
                  <div className="text-center text-white/90 py-8">No reviews found.</div>
                ) : (
                  filteredRecommendations.map((rec) => (
                    <div key={rec.id}>
                      <RecommendationCard
                        recommendation={rec}
                        onLike={(id) => handleLike(id)}
                        onDislike={(id) => handleDislike(id)}
                      />
                      {rec.videoUrl && rec.videoUrl.trim() !== ""? (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSelectedVideo({
                                videoUrl: rec.videoUrl,
                                businessName: rec.productName,
                                thumbnail: rec.thumbnail,
                              })
                            }
                            className="text-sm font-semibold text-white/90 underline"
                            aria-label={`Play video for ${rec.productName}`}
                          >
                            ▶ Watch video
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-sm text-center italic">
                  These recommendations are for informational purposes only and not a substitute for medical advice.
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

      {/* Video Modal — REPLACE existing modal iframe block with this */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl bg-transparent rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute right-2 top-2 z-50 bg-white/90 rounded-full p-2"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="aspect-video bg-black">
              {(() => {
                const raw = selectedVideo.videoUrl || "";
                const src = ensureProtocol(String(raw));
                const ytId = getYouTubeId(src);
                const driveId = getDriveFileId(src);

                if (ytId) {
                  // embed YouTube
                  const embed = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
                  return (
                    <iframe
                      title={selectedVideo.businessName || "Video"}
                      src={embed}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                if (driveId) {
                  // Google Drive preview/embed URL
                  const embed = `https://drive.google.com/file/d/${driveId}/preview`;
                  return (
                    <iframe
                      title={selectedVideo.businessName || "Video"}
                      src={embed}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                // fallback to raw URL in an iframe (ensure protocol)
                return (
                  <iframe
                    title={selectedVideo.businessName || "Video"}
                    src={ensureProtocol(String(raw))}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>

            <div className="p-3 bg-white/90 text-gray-800 font-semibold">{selectedVideo.businessName}</div>
          </div>
        </div>
      )}

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