/**
 * Fully mocked FinTech data for the Uplaud Product MVP Dashboard.
 * All entities live in-memory and can be reset via localStorage.
 */

export const BRAND = {
  company: "Westgate Wealth",
  domain: "westgate.finance",
  logoInitial: "W",
  vertical: "Fintech / Wealth Management",
};

export const REVIEW_SOURCES = [
  {
    id: "google",
    label: "Google Reviews",
    connected: true,
    count: 412,
    color: "#4285F4",
  },
  {
    id: "trustpilot",
    label: "Trustpilot",
    connected: true,
    count: 187,
    color: "#00b67a",
  },
  {
    id: "yelp",
    label: "Yelp",
    connected: false,
    count: 0,
    color: "#d32323",
  },
  {
    id: "app-store",
    label: "App Store",
    connected: false,
    count: 0,
    color: "#111827",
  },
  {
    id: "csv",
    label: "CSV / Flat file",
    connected: true,
    count: 88,
    color: "#6d46c6",
  },
];

export const REVIEWS = [
  {
    id: "rv_001",
    customer: "James Whitaker",
    handle: "@jwhit",
    rating: 5,
    source: "Google",
    date: "2026-02-08",
    sentiment: "positive",
    tags: ["retirement", "fee-only"],
    title: "Retired 4 years earlier than planned",
    body:
      "Westgate mapped out 12 retirement scenarios in the first call. Zero product pushing, transparent flat fee, and I retired in 2025 instead of 2029. Genuinely life-changing advice.",
    verified: true,
    location: "Austin, TX",
    ltv: "$18,400 AUM fee/yr",
  },
  {
    id: "rv_002",
    customer: "Priya Menon",
    handle: "@priyam",
    rating: 5,
    source: "Trustpilot",
    date: "2026-02-05",
    sentiment: "positive",
    tags: ["tax", "high-income", "planning"],
    title: "Saved us $27k in taxes year one",
    body:
      "Our previous advisor pushed products. Westgate rebuilt our tax stack — mega backdoor Roth, DAF, QSBS on my exit — and clawed back $27,300 in year one alone.",
    verified: true,
    location: "San Francisco, CA",
    ltv: "$24,900 AUM fee/yr",
  },
  {
    id: "rv_003",
    customer: "Marcus Chen",
    handle: "@mchen",
    rating: 5,
    source: "Google",
    date: "2026-02-02",
    sentiment: "positive",
    tags: ["early-retirement", "modeling"],
    title: "Finally an advisor who models before selling",
    body:
      "Loved the Monte Carlo output. They ran 10,000 simulations of our plan and walked me through the tail risks like an actuary would. No hard sells, no jargon.",
    verified: true,
    location: "Denver, CO",
    ltv: "$14,200 AUM fee/yr",
  },
  {
    id: "rv_004",
    customer: "Alicia Rowe",
    handle: "@aliciar",
    rating: 4,
    source: "Trustpilot",
    date: "2026-01-29",
    sentiment: "positive",
    tags: ["responsive", "onboarding"],
    title: "Great onboarding, still learning the portal",
    body:
      "The onboarding flow was smooth and my advisor Nick is super responsive. The portal has a small learning curve but everything I need is there.",
    verified: true,
    location: "Seattle, WA",
    ltv: "$9,800 AUM fee/yr",
  },
  {
    id: "rv_005",
    customer: "Robert Delgado",
    handle: "@rdelgado",
    rating: 5,
    source: "Google",
    date: "2026-01-24",
    sentiment: "positive",
    tags: ["estate", "trust"],
    title: "Set up our whole trust in one afternoon",
    body:
      "We had procrastinated setting up an estate plan for years. Westgate walked us through revocable trust, POA, healthcare directive in a single working session.",
    verified: true,
    location: "Chicago, IL",
    ltv: "$11,600 AUM fee/yr",
  },
  {
    id: "rv_006",
    customer: "Dana Chowdhury",
    handle: "@danac",
    rating: 3,
    source: "Trustpilot",
    date: "2026-01-20",
    sentiment: "neutral",
    tags: ["pricing"],
    title: "Solid advice, pricing felt high at first",
    body:
      "Advice is genuinely great and I've stayed on, but the flat fee felt steep for the first 6 months before results compounded.",
    verified: true,
    location: "Miami, FL",
    ltv: "$7,200 AUM fee/yr",
  },
  {
    id: "rv_007",
    customer: "Elena Popov",
    handle: "@epopov",
    rating: 5,
    source: "Google",
    date: "2026-01-15",
    sentiment: "positive",
    tags: ["equity-comp", "RSU"],
    title: "Nailed our RSU + secondary strategy",
    body:
      "Sold half our RSUs on a scheduled 10b5-1, held the rest, diversified into muni. Our tax hit was 40% lower than projected.",
    verified: true,
    location: "New York, NY",
    ltv: "$31,000 AUM fee/yr",
  },
  {
    id: "rv_008",
    customer: "Trevor Blake",
    handle: "@trevb",
    rating: 5,
    source: "Google",
    date: "2026-01-10",
    sentiment: "positive",
    tags: ["small-business", "SEP-IRA"],
    title: "Best advisor for a small business owner",
    body:
      "Set up SEP-IRA, defined-benefit plan, and cash-balance combo. Sheltered $210k of income in year one. My accountant now refers clients to Westgate.",
    verified: true,
    location: "Nashville, TN",
    ltv: "$22,400 AUM fee/yr",
  },
  {
    id: "rv_009",
    customer: "Hannah Reyes",
    handle: "@hreyes",
    rating: 5,
    source: "CSV",
    date: "2026-01-06",
    sentiment: "positive",
    tags: ["divorce", "planning"],
    title: "Helped rebuild finances post-divorce",
    body:
      "Post-divorce I was overwhelmed. Westgate rebuilt my whole financial life in 90 days: cash-flow model, new retirement account, insurance, will update.",
    verified: true,
    location: "Boston, MA",
    ltv: "$8,900 AUM fee/yr",
  },
  {
    id: "rv_010",
    customer: "Omar Khalil",
    handle: "@omark",
    rating: 5,
    source: "Trustpilot",
    date: "2026-01-02",
    sentiment: "positive",
    tags: ["expat", "cross-border"],
    title: "Cross-border planning done right",
    body:
      "US-UK dual tax situation. Westgate coordinated with our UK accountant, filed a proper 8938 & FBAR strategy, and set up a portfolio that respects PFIC rules.",
    verified: true,
    location: "London, UK",
    ltv: "$19,700 AUM fee/yr",
  },
  {
    id: "rv_011",
    customer: "Sophie Laurent",
    handle: "@slaurent",
    rating: 4,
    source: "Google",
    date: "2025-12-28",
    sentiment: "positive",
    tags: ["responsive", "advisor"],
    title: "Nick is a phenomenal advisor",
    body:
      "Nick answers within a day, gives me actual answers not sales pitches. Portfolio has done what it was supposed to do — nothing more, nothing less.",
    verified: true,
    location: "Portland, OR",
    ltv: "$6,400 AUM fee/yr",
  },
  {
    id: "rv_012",
    customer: "Kevin O'Brien",
    handle: "@kobrien",
    rating: 2,
    source: "Trustpilot",
    date: "2025-12-20",
    sentiment: "negative",
    tags: ["support", "delay"],
    title: "Slow to respond during volatile week",
    body:
      "During the December vol spike my calls went unreturned for 3 days. Advice ended up fine but the silence was uncomfortable.",
    verified: true,
    location: "Phoenix, AZ",
    ltv: "$5,200 AUM fee/yr",
  },
];

export const AGENT_RECOMMENDATIONS = {
  rv_001: [
    { id: "r1", agent: "social", label: "Turn into LinkedIn testimonial post", confidence: 0.94 },
    { id: "r2", agent: "referral", label: "Send referral offer — high LTV client", confidence: 0.91 },
    { id: "r3", agent: "reddit", label: "Reply in r/financialindependence thread", confidence: 0.82 },
    { id: "r4", agent: "attribution", label: "Feature quote in Google Ads RSA", confidence: 0.78 },
  ],
  rv_002: [
    { id: "r1", agent: "social", label: "Turn into X (Twitter) tax-savings post", confidence: 0.96 },
    { id: "r2", agent: "referral", label: "Trigger tax-season referral campaign", confidence: 0.93 },
    { id: "r3", agent: "reddit", label: "Answer r/tax question thread", confidence: 0.79 },
  ],
  rv_003: [
    { id: "r1", agent: "social", label: "LinkedIn thought-leadership carousel", confidence: 0.88 },
    { id: "r2", agent: "attribution", label: "Add quote to Meta ad rotation", confidence: 0.74 },
  ],
  rv_007: [
    { id: "r1", agent: "social", label: "Instagram Reel — RSU strategy hook", confidence: 0.91 },
    { id: "r2", agent: "referral", label: "Refer-a-founder campaign (tech)", confidence: 0.87 },
  ],
};

export const SOCIAL_POSTS = [
  {
    id: "sp_001",
    reviewId: "rv_001",
    platform: "linkedin",
    tone: "professional",
    status: "draft",
    scheduled: null,
    body:
      "\"Westgate mapped out 12 retirement scenarios in the first call.\"\n\nJames W. retired 4 years earlier than planned — not because we found alpha, but because we found alignment. Flat fee. Zero product pushing. Just modeling.\n\nSee if fee-only planning fits you →",
    hashtags: ["#feeonly", "#retirement", "#financialplanning"],
    predictedReach: "12.4k",
    predictedEngagement: "4.1%",
  },
  {
    id: "sp_002",
    reviewId: "rv_002",
    platform: "x",
    tone: "punchy",
    status: "scheduled",
    scheduled: "2026-02-14T09:00:00Z",
    body:
      "Priya M. wrote: \"Saved us $27k in taxes year one.\"\n\nMega backdoor Roth. DAF. QSBS on her exit.\n\nWe don't sell products. We rebuild tax stacks.",
    hashtags: ["#taxplanning", "#qsbs"],
    predictedReach: "38.2k",
    predictedEngagement: "2.7%",
  },
  {
    id: "sp_003",
    reviewId: "rv_007",
    platform: "instagram",
    tone: "founder-story",
    status: "published",
    scheduled: "2026-02-01T14:00:00Z",
    body:
      "Elena's RSU strategy → 40% lower tax hit.\n\nScheduled 10b5-1 sells, held the rest, rotated into muni bonds.\n\nThe difference between good advice and great advice is 6 figures.",
    hashtags: ["#RSU", "#techemployees", "#taxstrategy"],
    predictedReach: "22.8k",
    predictedEngagement: "5.6%",
  },
];

export const REFERRAL_CAMPAIGNS = [
  {
    id: "rc_001",
    name: "High-LTV Retirement Referrals",
    seedReviewIds: ["rv_001", "rv_007", "rv_008"],
    status: "active",
    incentive: "$500 statement credit",
    channel: "SMS + Email",
    sent: 34,
    clicked: 21,
    booked: 9,
    converted: 4,
    revenue: "$67,200",
    started: "2026-01-14",
  },
  {
    id: "rc_002",
    name: "Tax Season Warm-Intros",
    seedReviewIds: ["rv_002"],
    status: "active",
    incentive: "Free tax review",
    channel: "Email",
    sent: 118,
    clicked: 62,
    booked: 27,
    converted: 11,
    revenue: "$142,900",
    started: "2026-01-04",
  },
  {
    id: "rc_003",
    name: "Founder-to-Founder",
    seedReviewIds: ["rv_007", "rv_010"],
    status: "draft",
    incentive: "$1,000 charity match",
    channel: "LinkedIn DM",
    sent: 0,
    clicked: 0,
    booked: 0,
    converted: 0,
    revenue: "$0",
    started: null,
  },
];

export const REDDIT_THREADS = [
  {
    id: "rd_001",
    subreddit: "r/financialindependence",
    title: "Fee-only advisor recommendations for someone approaching FIRE?",
    author: "u/coastfire2027",
    posted: "3 hours ago",
    upvotes: 214,
    comments: 87,
    sentiment: "opportunity",
    matchScore: 0.94,
    excerpt:
      "I'm 4 years from my FIRE number and want an advisor who won't try to sell me an annuity. Fee-only, ideally someone who models scenarios rigorously...",
    suggestedReply: {
      reviewId: "rv_001",
      body:
        "Not affiliated, but Westgate Wealth is who my colleague used to hit his number 4 years ahead of schedule. Flat fee, they run Monte Carlo across 10,000 paths and won't touch commission products. Worth a first call.",
      tone: "helpful-neutral",
    },
  },
  {
    id: "rd_002",
    subreddit: "r/tax",
    title: "Best strategy for QSBS + mega backdoor Roth combo?",
    author: "u/exitplanning",
    posted: "6 hours ago",
    upvotes: 89,
    comments: 34,
    sentiment: "opportunity",
    matchScore: 0.91,
    excerpt:
      "Just had a partial exit, expecting $2M in QSBS-qualified stock. Want to combine with mega backdoor Roth this year without triggering pro-rata rules...",
    suggestedReply: {
      reviewId: "rv_002",
      body:
        "Westgate handled almost this exact stack for a friend — QSBS + DAF + mega backdoor. Key trick was sequencing the Roth conversion in a low-income year. Not investment advice, just what actually worked.",
      tone: "helpful-neutral",
    },
  },
  {
    id: "rd_003",
    subreddit: "r/personalfinance",
    title: "Divorce cleanup — where do I even start?",
    author: "u/newchapter2026",
    posted: "1 day ago",
    upvotes: 456,
    comments: 178,
    sentiment: "opportunity",
    matchScore: 0.86,
    excerpt:
      "Recently divorced, need to rebuild retirement, insurance, will, everything. Feeling overwhelmed and worried about being sold products...",
    suggestedReply: {
      reviewId: "rv_009",
      body:
        "First — you're doing the right thing by not rushing into a product. A friend used Westgate post-divorce, they rebuilt her entire plan in 90 days flat-fee. Whatever route you take, avoid anyone paid by commission.",
      tone: "empathetic",
    },
  },
  {
    id: "rd_004",
    subreddit: "r/ExpatFIRE",
    title: "US-UK cross-border planning — recommendations?",
    author: "u/londonyank",
    posted: "2 days ago",
    upvotes: 67,
    comments: 22,
    sentiment: "opportunity",
    matchScore: 0.83,
    excerpt:
      "Moved to London for work, holding US-domiciled index funds. Worried about PFIC exposure and FBAR compliance...",
    suggestedReply: {
      reviewId: "rv_010",
      body:
        "PFIC is the trap. Westgate coordinated my colleague's US-UK stack with his UK accountant — proper 8938/FBAR, portfolio rebuilt to respect PFIC rules. Cross-border is niche but they've done it.",
      tone: "helpful-neutral",
    },
  },
];

export const KPIS = {
  reviewsImported: { value: 687, delta: "+42 this week", trend: "up" },
  postsPublished: { value: 128, delta: "+19 this week", trend: "up" },
  referralsSent: { value: 152, delta: "+34 this week", trend: "up" },
  redditReplies: { value: 41, delta: "+7 this week", trend: "up" },
  attributedRevenue: { value: "$284,300", delta: "+18.4% MoM", trend: "up" },
  cac: { value: "$412", delta: "−31% vs paid", trend: "down-good" },
};

export const FUNNEL = [
  { stage: "Reviews imported", count: 687, pct: 100 },
  { stage: "Flagged as trust signal", count: 512, pct: 74 },
  { stage: "Turned into content", count: 341, pct: 50 },
  { stage: "Prospect engaged", count: 218, pct: 32 },
  { stage: "Booked a call", count: 74, pct: 11 },
  { stage: "Converted", count: 24, pct: 3.5 },
];

export const CHANNEL_ATTRIBUTION = [
  { channel: "Social (LinkedIn/X)", touches: 1284, converted: 11, revenue: "$118,400", cac: "$387" },
  { channel: "Referral Agent", touches: 152, converted: 4, revenue: "$67,200", cac: "$210" },
  { channel: "Reddit Insert", touches: 89, converted: 5, revenue: "$62,800", cac: "$168" },
  { channel: "Paid Search + Reviews", touches: 4210, converted: 4, revenue: "$35,900", cac: "$1,204" },
];

export const TREND_30D = [
  12, 14, 13, 18, 22, 20, 24, 28, 26, 30, 34, 32, 38, 41, 44, 42, 48, 52, 55, 58, 61, 64, 68, 72, 74, 78, 82, 86, 89, 92,
];
