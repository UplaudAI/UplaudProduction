import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  Share2,
  ArrowLeft,
  CheckCircle,
  ThumbsUp,
  Users,
  Award,
  Linkedin,
  Instagram,
  Globe,
  Search,
  BadgeCheck,
} from "lucide-react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ===================== Airtable Config ===================== */
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || "";
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || "";
const USERS_TABLE = import.meta.env.VITE_AIRTABLE_USERS_TABLE || "";
const REVIEWS_TABLE = import.meta.env.VITE_AIRTABLE_REVIEWS_TABLE || "";
const CIRCLES_TABLE = import.meta.env.VITE_AIRTABLE_CIRCLES_TABLE || "";

/* ===================== HTTP helpers ===================== */
const AIRTABLE = axios.create({
  baseURL: `https://api.airtable.com/v0/${BASE_ID}/`,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

function escapeAirtableString(v: string) {
  return `"${(v || "").replace(/"/g, '\\"')}"`;
}

async function fetchAllPages<T = any>(
  table: string,
  params: Record<string, any>
): Promise<T[]> {
  const out: T[] = [];
  let offset: string | undefined = undefined;
  let safety = 0;
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

  if (/^https?:\/\//i.test(v)) return ensureProtocol(v);
  if (provider === "website" || /\./.test(v)) return ensureProtocol(v);

  if (provider === "linkedin") {
    const path = v.replace(/^\/+/, "");
    if (path.toLowerCase().includes("linkedin.com")) return ensureProtocol(path);
    return `https://www.linkedin.com/${path}`;
  }

  if (provider === "instagram") {
    const withoutAt = v.startsWith("@") ? v.slice(1) : v.replace(/^\/+/, "");
    if (withoutAt.toLowerCase().includes("instagram.com")) return ensureProtocol(withoutAt);
    return `https://www.instagram.com/${withoutAt}`;
  }

  return ensureProtocol(v);
}

function getDisplayFromUrl(url?: string) {
  if (!url) return "";
  const v = String(url).trim();
  try {
    if (!/^https?:\/\//i.test(v)) {
      if (v.startsWith("@")) return v;
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

/** Video helpers (YouTube / Drive) */
function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = url.trim();
    const m1 = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
    if (m1 && m1[1]) return m1[1];
    const m2 = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i) || u.match(/\/embed\/([A-Za-z0-9_-]{6,})/i);
    if (m2 && m2[1]) return m2[1];
    return null;
  } catch {
    return null;
  }
}
function getYouTubeThumbnail(url?: string): string | null {
  const id = getYouTubeId(url || "");
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}
function getDriveFileId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = url.trim();
    const m1 = u.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/);
    if (m1 && m1[1]) return m1[1];
    const m2 = u.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
    if (m2 && m2[1]) return m2[1];
    return null;
  } catch {
    return null;
  }
}
function normalizeVideoUrl(raw?: any): string | null {
  if (!raw || (typeof raw === "string" && raw.trim() === "")) return null;

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

  if (typeof raw === "object") {
    if (raw.url && String(raw.url).trim()) return ensureProtocol(String(raw.url).trim());
    if (raw.fields && raw.fields.url && String(raw.fields.url).trim())
      return ensureProtocol(String(raw.fields.url).trim());
    return null;
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    const ytId = getYouTubeId(s);
    if (ytId) {
      return `https://www.youtube.com/watch?v=${ytId}`;
    }
    const driveId = getDriveFileId(s);
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    if (/^https?:\/\//i.test(s) || /\./.test(s)) {
      return ensureProtocol(s);
    }
    return null;
  }

  return null;
}

/* Small helpers */
function emojiForScore(score?: number) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
const digitsOnly = (s = "") => (s || "").toString().replace(/\D/g, "");
const last3 = (s = "") => {
  const d = digitsOnly(s);
  if (!d) return "000";
  return d.slice(-3).padStart(3, "0");
};
async function fetchLast3FromReviews(foundUser: any) {
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

/* ===================== Stats Row (conditional rendering) ===================== */
const StatsRow = ({
  recommendations,
  followers,
}: {
  recommendations: number;
  followers: number;
}) => {
  const Box = ({
    bg,
    icon,
    label,
    value,
  }: {
    bg: string;
    icon?: React.ReactNode;
    label: string;
    value: string | number;
  }) => (
    <div
      className={`flex-1 ${bg} rounded-xl shadow-md p-4 sm:p-5 flex flex-col items-center justify-center`}
      style={{ minHeight: 92, backdropFilter: "blur(4px)" }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-lg sm:text-xl font-extrabold tabular-nums">{value}</div>
      </div>
      <div className="text-[13px] text-gray-700 mt-1 font-medium">{label}</div>
    </div>
  );

  // Show only recommendations if followers is 0
  if (followers === 0) {
    return (
      <div className="flex gap-4">
        <Box
          bg="bg-violet-50 text-violet-800"
          icon={<Award className="w-4 h-4 text-violet-800" />}
          label="Recommendations"
          value={recommendations ?? 0}
        />
      </div>
    );
  }

  // Show both if followers > 0
  return (
    <div className="flex gap-4">
      <Box
        bg="bg-violet-50 text-violet-800"
        icon={<Award className="w-4 h-4 text-violet-800" />}
        label="Recommendations"
        value={recommendations ?? 0}
      />
      <Box
        bg="bg-rose-50 text-rose-800"
        icon={<Users className="w-4 h-4 text-rose-800" />}
        label="Followers"
        value={(followers || 0).toLocaleString()}
      />
    </div>
  );
};

/* ===================== Recommendation Card (unchanged) ===================== */
interface Recommendation {
  id: string;
  productName: string;
  category: string;
  rating: number;
  date: Date | null;
  description: string;
  likes: number;
  dislikes: number;
  videoUrl?: string | null;
  thumbnail?: string;
  userLiked?: boolean;
  userDisliked?: boolean;
}

const RecommendationCard = ({
  recommendation,
  onLike,
  onDislike,
  onPlay,
}: {
  recommendation: Recommendation;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onPlay?: (payload: { videoUrl: string; businessName: string; thumbnail?: string }) => void;
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
      <div className="w-full px-3 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <Link
              to={`/business/${slugify(recommendation.productName)}`}
              className="w-full font-bold text-base sm:text-lg text-black hover:underline hover:text-purple-700 break-words whitespace-normal leading-tight"
              title={recommendation.productName}
              style={{ hyphens: "auto" }}
            >
              {recommendation.productName}
            </Link>
            <p className="text-sm text-purple-700 font-medium mt-1">
              {recommendation.category}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {recommendation.rating ? (
              <span className="flex items-center leading-none">
                {Array.from({ length: Math.max(0, Math.round(recommendation.rating)) }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm sm:text-lg leading-none">
                    ★
                  </span>
                ))}
                <span className="ml-2 text-lg sm:text-2xl leading-none">
                  {emojiForScore(recommendation.rating)}
                </span>
              </span>
            ) : null}

            <span className="text-gray-500 text-xs sm:text-sm font-medium">
              {formatDate(recommendation.date)}
            </span>

            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center rounded-md p-2 bg-transparent hover:bg-transparent transition"
              aria-label="Share this recommendation"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="sm:hidden mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {recommendation.rating ? (
              <span className="flex items-center leading-none">
                {Array.from({ length: Math.max(0, Math.round(recommendation.rating)) }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm leading-none">
                    ★
                  </span>
                ))}
                <span className="ml-2 text-xl leading-none">{emojiForScore(recommendation.rating)}</span>
              </span>
            ) : null}
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

      <div className="mt-3 w-full">
        <div
          className="w-full px-3 py-3 text-gray-900 text-base font-medium break-words"
          style={{ background: "#DCF8C6" }}
        >
          <div className="flex items-start gap-3">
            {recommendation.videoUrl ? (
              <div className="flex-shrink-0">
                <button
                  onClick={() =>
                    onPlay &&
                    onPlay({
                      videoUrl: recommendation.videoUrl || "",
                      businessName: recommendation.productName,
                      thumbnail: recommendation.thumbnail || "",
                    })
                  }
                  aria-label={`Play video for ${recommendation.productName}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden shadow-sm focus:outline-none"
                >
                  {recommendation.thumbnail ? (
                    <img
                      src={recommendation.thumbnail}
                      alt={`${recommendation.productName} thumbnail`}
                      className="w-full h-full object-cover"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="bg-black/40 rounded-full p-1.5">
                        <span className="text-white font-bold text-base">▶</span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <span style={{ display: "block", wordBreak: "break-word" }}>
                {displayText}
                {needsTruncation && !showFullText && "..."}
              </span>
              {needsTruncation && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowFullText(!showFullText)}
                    className="text-purple-700 hover:text-purple-900 text-sm font-semibold underline"
                  >
                    {showFullText ? "See Less" : "See More"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 flex items-center gap-4">
        <span className="text-sm text-gray-600">Was this helpful?</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(recommendation.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              recommendation.userLiked ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-green-50"
            }`}
            aria-label="Like this recommendation"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{recommendation.likes}</span>
          </button>
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
        const idParam = (id || "").trim();
        const users = await fetchAllPages<any>(USERS_TABLE, {});
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        let foundExpert: any = null;
        for (const rec of users) {
          const name = rec.fields?.Name || "";
          const baseSlug = slugify(name);
          let l3 = last3(rec.fields?.Phone || "");
          const canonical = `${baseSlug}-${l3 || "000"}`;
          const isExact = targetSuffix ? canonical === idParam : baseSlug === targetBase;

          const expertRaw = rec.fields?.Expert;
          const isExpert =
            typeof expertRaw === "number"
              ? expertRaw === 1
              : typeof expertRaw === "boolean"
              ? expertRaw
              : String(expertRaw ?? "").trim() === "1";

          if (isExact && isExpert) {
            foundExpert = {
              id: rec.fields?.ID?.toString(),
              airtableId: rec.id,
              name,
              phone: rec.fields?.Phone || "",
              autogenInvite: rec.fields?.["Autogen Invite"] ?? "",
              bio: rec.fields?.bio ?? rec.fields?.Bio ?? "",
              fullBio: rec.fields?.About ?? "",
              location: rec.fields?.Location ?? rec.fields?.location ?? "",
              gender: rec.fields?.Gender || rec.fields?.gender || "Male",
              isVerified: !!rec.fields?.verified,
              rating: typeof rec.fields?.rating === "number" ? rec.fields?.rating : 0,
              recommendationsCount:
                typeof rec.fields?.recommendationsCount === "number"
                  ? rec.fields?.recommendationsCount
                  : 0,
              followers: rec.fields?.followers || 0,
              image: Array.isArray(rec.fields?.image)
                ? rec.fields?.image[0]?.url
                : rec.fields?.image,
              linkedin: rec.fields?.["LinkedIn Profile"] ?? "",
              instagram: rec.fields?.["Instagram Profile"] ?? "",
              website:
                rec.fields?.Website ??
                rec.fields?.["Website URL"] ??
                rec.fields?.["Personal Website"] ??
                "",
              expert: rec.fields?.Expert ?? "",
              credentials: rec.fields?.Credentials ?? rec.fields?.credentials ?? "",
              expertiseAreas: rec.fields?.["Expertise Areas"] ?? "",
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

        const recs = await fetchAllPages<any>(REVIEWS_TABLE, {
          filterByFormula: `{ID (from Creator)}=${escapeAirtableString(foundExpert.id || "")}`,
        });

        let allRecs = recs;
        if (!allRecs || allRecs.length === 0) {
          const byName = await fetchAllPages<any>(REVIEWS_TABLE, {
            filterByFormula: `{Name_Creator}=${escapeAirtableString(foundExpert.name || "")}`,
          });
          allRecs = byName;
        }

        const mappedRecs: Recommendation[] = (allRecs || [])
          .map((r: any) => {
            const rawVideo =
              r.fields?.VideoURL ??
              r.fields?.Video ??
              r.fields?.["Video URL"] ??
              r.fields?.["Share Link"] ??
              r.fields?.["ShareLink"];

            const normalizedVideo = normalizeVideoUrl(rawVideo);

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
              videoUrl: (() => {
                if (!normalizedVideo) return null;
                const ytId = getYouTubeId(normalizedVideo);
                const driveId = getDriveFileId(normalizedVideo);
                return ytId || driveId ? normalizedVideo : null;
              })(),
              thumbnail: thumb || "",
            };
          })
          .filter((r) => !!r.productName && !!r.description);

        const sortedRecs = mappedRecs.slice().sort((a, b) => {
          const at = a.date ? a.date.getTime() : 0;
          const bt = b.date ? b.date.getTime() : 0;
          return bt - at;
        });

        let rating = foundExpert.rating || 0;
        if ((!rating || rating === 0) && mappedRecs.length > 0) {
          const sum = mappedRecs.reduce((s, x) => s + (x.rating || 0), 0);
          rating = sum / mappedRecs.length;
        }

        const recommendationsCount = mappedRecs.length || foundExpert.recommendationsCount || 0;

        const joinDate =
          sortedRecs.length > 0 && sortedRecs[sortedRecs.length - 1].date
            ? formatDate(sortedRecs[sortedRecs.length - 1].date)
            : "—";

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
    if (reviewFilter === "video" && !rec.videoUrl) return false;
    if (reviewFilter === "text" && rec.videoUrl) return false;

    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return true;

    const hay = [
      rec.productName,
      rec.description,
      rec.category,
      rec.rating?.toString(),
      rec.date ? formatDate(rec.date) : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(term);
  });

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

      <div className="max-w-6xl mx-auto space-y-6 relative z-10 px-4 sm:px-6 lg:px-8 pt-24">
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

        {/* Header Card */}
        <div
          className="rounded-2xl shadow-lg overflow-hidden border"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255,255,255,0.6)",
          }}
        >
          {/* subtle banner / top band */}
          <div
            className="h-28 w-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(98,20,168,0.10), rgba(140,56,196,0.06))",
            }}
          />

          {/* content area */}
          <div className="px-6 -mt-12 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              {/* Left: avatar + vertical info */}
              <div className="sm:col-span-7 flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-xl bg-purple-600 flex items-center justify-center">
                    {expert?.image ? (
                      <img
                        src={expert.image}
                        alt={expert?.name || "Expert"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white font-extrabold text-2xl">
                        {expert?.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                    )}
                    {expert?.isVerified && (
                      <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{expert?.name}</h1>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold shadow-md">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Expert
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{expert?.bio}</p>

                  <div className="flex items-center gap-3 mt-4">
                    <Button
                      onClick={handleFollow}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Follow
                    </Button>

                    <button
                      onClick={handleShare}
                      className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow hover:bg-gray-50"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                      aria-label="Share profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <div className="ml-2 text-sm text-gray-700">Joined {expert?.joinDate ?? "—"}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 items-center text-sm text-gray-800">
                    {expert?.linkedin ? (
                      <a
                        href={buildSocialHref("linkedin", expert.linkedin) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline"
                        title={expert.linkedin}
                      >
                        <Linkedin className="w-4 h-4 text-gray-800" />
                        <span className="truncate max-w-[240px]">{getDisplayFromUrl(expert.linkedin)}</span>
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
                        <span className="truncate max-w-[240px]">{getDisplayFromUrl(expert.instagram)}</span>
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
                        <span className="truncate max-w-[240px]">{getDisplayFromUrl(expert.website)}</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right: stat boxes (removed rating, conditional followers) */}
              <div className="sm:col-span-5 flex items-start">
                <div className="w-full">
                  <StatsRow
                    recommendations={expert.recommendationsCount}
                    followers={expert.followers}
                  />
                </div>
              </div>
            </div>

            {/* Expertise Areas row */}
            {expert?.expertiseAreas && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.expertiseAreas.split(',').map((area: string, idx: number) => {
                    const trimmed = area.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15))",
                          color: "#6214a8",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                        }}
                      >
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* small credentials / badges row below header (optional) */}
            {expert?.credentials && (
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white/80 rounded-full text-sm shadow text-gray-700">
                  {expert.credentials}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* About Card (neat card below) */}
        <Card
          className="w-full backdrop-blur-md p-6"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.6)",
            borderRadius: "1rem",
          }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
          <p className="text-gray-700 text-base">
            {showFullBio
              ? expert.fullBio
              : (expert.fullBio || "").slice(0, 250) + ((expert.fullBio || "").length > 250 ? "..." : "")}
            {expert.fullBio && expert.fullBio.length > 250 && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-purple-700 hover:text-purple-900 font-semibold ml-1"
              >
                {showFullBio ? "See Less" : "See More"}
              </button>
            )}
          </p>
        </Card>

        {/* Tabs, filters, search, and recommendation list */}
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

              {/* Reviews list */}
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
                        onPlay={(payload) => setSelectedVideo(payload)}
                      />
                    </div>
                  ))
                )}
              </div>

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

      {/* Video Modal */}
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