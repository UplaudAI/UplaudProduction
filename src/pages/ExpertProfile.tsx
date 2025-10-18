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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// For security, API keys should be stored in environment variables
// These are placeholder values - replace with your actual Airtable configuration
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || "";
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || "";

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
          <button
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

  // Mock data - replace with actual API calls
  const [expert, setExpert] = useState<any>({
    name: "Dr. Aditi Sharma",
    credentials: "BAMS, MD Ayurveda | Skin & Digestion Specialist",
    bio: "Helping people balance mind and digestion through Ayurveda",
    fullBio:
      "Dr. Aditi Sharma is a certified Ayurvedic practitioner with over 12 years of experience in holistic healing. She specializes in treating digestive disorders and skin conditions using traditional Ayurvedic principles combined with modern wellness approaches.",
    isVerified: true,
    rating: 4.8,
    recommendationsCount: 127,
    followers: 3542,
    image: "",
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "1",
      productName: "Organic Triphala Powder",
      category: "For Better Digestion",
      rating: 4.9,
      date: new Date("2025-10-08"),
      description:
        "This organic Triphala powder has been incredibly effective for my patients dealing with irregular digestion and constipation. It's gentle yet powerful, promoting natural cleansing without causing dependency.",
      likes: 89,
      dislikes: 3,
    },
    {
      id: "2",
      productName: "Himalaya Ashwagandha Capsules",
      category: "For Better Sleep & Stress",
      rating: 4.7,
      date: new Date("2025-09-28"),
      description:
        "An excellent adaptogenic supplement for modern lifestyle stress. I recommend this to patients experiencing sleep disturbances, anxiety, and fatigue. The quality is consistent and effects are noticeable within 2-3 weeks.",
      likes: 124,
      dislikes: 8,
    },
  ]);

  const [activeTab, setActiveTab] = useState<"Recommendations" | "Activity">(
    "Recommendations"
  );
  const [showFullBio, setShowFullBio] = useState(false);
  const [loading, setLoading] = useState(false);

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

            {/* Name & Verified Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="font-extrabold text-2xl sm:text-3xl">{expert?.name}</h2>
              {expert?.isVerified && (
                <CheckCircle className="w-6 h-6 text-green-600 fill-green-600" />
              )}
            </div>

            {/* Credentials */}
            <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">
              {expert?.credentials}
            </p>

            {/* Bio */}
            <p className="text-sm sm:text-base text-gray-600 mb-4">{expert?.bio}</p>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
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
