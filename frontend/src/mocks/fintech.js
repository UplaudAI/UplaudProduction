/**
 * Fully mocked PayRewards data for the Uplaud Growth Activation Platform demo.
 *
 * PayRewards = B2B payments platform (fintech).
 * Businesses pay their vendors/business bills via credit cards to earn points & rewards.
 * They acquire mostly through Meta + Google Ads driving demo bookings.
 * Uplaud sits on top of that acquisition engine and activates every meaningful
 * interaction — before AND after purchase — into compounding growth.
 */

export const BRAND = {
  company: "PayRewards",
  domain: "payrewards.com",
  logoInitial: "P",
  vertical: "B2B Payments · Card-earned Rewards",
  tagline: "Pay vendors on your credit card. Earn points that pay for themselves.",
  primaryAcquisition: "Meta + Google Ads → Demo Bookings",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  JOURNEY FUNNEL — the spine of the Growth Engine dashboard                */
/* ────────────────────────────────────────────────────────────────────────── */
export const JOURNEY_STAGES = [
  {
    id: "ad_clicked",
    label: "Ad clicked",
    phase: "acquisition",
    count: 48210,
    delta: "+8.2%",
    color: "#e2d9f5",
    hint: "Meta + Google Ads",
    tip: "Rewrite headline creative with \"pays for itself\" — projected 1.7× CTR based on your conversion history.",
  },
  {
    id: "demo_booked",
    label: "Demo booked",
    phase: "activation",
    count: 892,
    delta: "+14%",
    color: "#d9c9f2",
    hint: "1.8% booked-to-clicked",
    tip: "Bookings peak on Tuesdays. Rebalance ad spend +18% Mon/Tue to lift booked-to-clicked.",
  },
  {
    id: "demo_attended",
    label: "Demo attended",
    phase: "activation",
    count: 641,
    delta: "+11%",
    color: "#c9b3ee",
    hint: "72% show-up rate",
    tip: "Send calendar reminders + a 30-sec teaser video 24h prior. Historical lift: +9% show-up.",
  },
  {
    id: "feedback_captured",
    label: "Feedback captured",
    phase: "activation",
    count: 388,
    delta: "+42%",
    color: "#b394e6",
    hint: "60% of attendees · Uplaud",
    tip: "Move the incentive AFTER the referral campaign launch — historically lifts feedback-share by 22%.",
    opportunity: true,
    opportunityText: "253 attendees haven't shared feedback yet",
  },
  {
    id: "stories_approved",
    label: "Testimonials approved",
    phase: "activation",
    count: 172,
    delta: "+38%",
    color: "#8f66d8",
    hint: "44% of captured · Uplaud",
    tip: "Send approval reminder Day 3. 68% of eventual approvals happen on the 3-day nudge.",
    opportunity: true,
    opportunityText: "38 drafts waiting for customer approval",
  },
  {
    id: "warm_intros",
    label: "Warm intros",
    phase: "activation",
    count: 94,
    delta: "+27%",
    color: "#6d46c6",
    hint: "Referral Agent",
    tip: "Seed campaigns to advocates with ≥2 mutual LinkedIn connections — converts 4.2× baseline.",
  },
  {
    id: "qualified_ops",
    label: "Qualified opportunities",
    phase: "pipeline",
    count: 48,
    delta: "+22%",
    color: "#5b32b2",
    hint: "SQL created in HubSpot",
    tip: "Warm-intro SQLs convert 3.1× faster. Auto-prioritise these in your AE queue.",
  },
  {
    id: "customers",
    label: "Customers",
    phase: "revenue",
    count: 21,
    delta: "+5",
    color: "#4a1f9a",
    hint: "New logos MTD",
    tip: "Trigger onboarding testimonial capture at Day 14 — highest-quality quotes come in early.",
  },
  {
    id: "advocates",
    label: "Advocates",
    phase: "advocacy",
    count: 14,
    delta: "+4",
    color: "#5eead4",
    hint: "NPS ≥ 9 · shared testimonial",
    tip: "Re-invite advocates for a fresh testimonial every 90 days — quotes decay in ad performance after 60d.",
    opportunity: true,
    opportunityText: "6 happy customers not yet activated",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  OPPORTUNITY CARDS — "where should I focus next?"                         */
/* ────────────────────────────────────────────────────────────────────────── */
export const OPPORTUNITIES = [
  {
    id: "op_001",
    priority: "high",
    icon: "MessageSquare",
    tone: "purple",
    stage: "Growth Activation",
    title: "253 demo attendees haven't shared feedback",
    subtitle: "Auto-drafted feedback prompts ready — average response rate 61%",
    impact: "~154 signals · ~38 testimonials · ~$412k pipeline lift",
    cta: "Send feedback prompts",
    ctaPath: "/business/interactions",
  },
  {
    id: "op_002",
    priority: "high",
    icon: "FileCheck",
    tone: "mint",
    stage: "Conversation Intelligence",
    title: "38 testimonial drafts awaiting customer approval",
    subtitle: "Extracted from Gong + Fireflies transcripts · authentic language",
    impact: "22 could ship this week",
    cta: "Send for approval",
    ctaPath: "/business/conversations",
  },
  {
    id: "op_003",
    priority: "medium",
    icon: "Sparkles",
    tone: "purple",
    stage: "Customer Advocacy",
    title: "6 advocates ready to be activated",
    subtitle: "NPS ≥ 9 · high-LTV · never asked for a referral",
    impact: "Est. 18 warm intros · 3 qualified ops",
    cta: "Launch referral campaign",
    ctaPath: "/business/referrals",
  },
  {
    id: "op_004",
    priority: "medium",
    icon: "TrendingUp",
    tone: "purple",
    stage: "Amplification",
    title: "3 approved testimonials not turned into content",
    subtitle: "LinkedIn draft ready · founder-tone matched to source",
    impact: "Projected 42k reach across LinkedIn + X",
    cta: "Draft posts",
    ctaPath: "/business/social",
  },
  {
    id: "op_005",
    priority: "low",
    icon: "Ghost",
    tone: "purple",
    stage: "Amplification",
    title: "4 Reddit threads asking about AP card payments",
    subtitle: "r/Accounting, r/smallbusiness · answer-eligible with real quotes",
    impact: "~3.4k impressions per approved reply",
    cta: "Draft helpful replies",
    ctaPath: "/business/reddit",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  INTERACTIONS — pre-customer + post-customer lifecycle events             */
/* ────────────────────────────────────────────────────────────────────────── */
export const INTERACTION_TYPES = {
  demo: { label: "Demo call", color: "#6d46c6" },
  trial: { label: "Trial start", color: "#8f66d8" },
  webinar: { label: "Webinar attended", color: "#b394e6" },
  event: { label: "Event / conference", color: "#5eead4" },
  onboarding: { label: "Onboarding", color: "#0f9b7c" },
  cs_checkin: { label: "CS check-in", color: "#4285F4" },
  qbr: { label: "QBR", color: "#a16207" },
  support: { label: "Support call", color: "#d97706" },
};

export const ACTIVATION_STATES = {
  pending: { label: "Not activated", tone: "grey" },
  prompt_sent: { label: "Prompt sent", tone: "purple" },
  feedback_received: { label: "Feedback captured", tone: "mint" },
  story_drafted: { label: "Testimonial drafted", tone: "purple" },
  awaiting_approval: { label: "Awaiting approval", tone: "amber" },
  approved: { label: "Approved", tone: "mint" },
  amplified: { label: "Amplified", tone: "mint" },
};

export const INTERACTIONS = [
  {
    id: "in_001",
    type: "demo",
    person: "Rohan Sethi",
    role: "VP Finance",
    company: "Blueprint Robotics",
    companyDomain: "blueprintrobotics.co",
    monthlySpend: "$180k",
    date: "2026-02-11",
    source: "Meta Ad · Finance Ops carousel",
    state: "feedback_received",
    signalScore: 0.94,
    note: "Loved the Amex MR earn rate. Asked about 1099 vendor limits.",
  },
  {
    id: "in_002",
    type: "demo",
    person: "Kavita Iyer",
    role: "Controller",
    company: "Northwind Interiors",
    companyDomain: "northwindinteriors.com",
    monthlySpend: "$92k",
    date: "2026-02-10",
    source: "Google Search · 'pay vendors credit card'",
    state: "story_drafted",
    signalScore: 0.91,
    note: "Switched from Bill.com. Wants case study on interior design vertical.",
  },
  {
    id: "in_003",
    type: "trial",
    person: "Marcus Beltran",
    role: "CFO",
    company: "Halo Skincare",
    companyDomain: "haloskincare.co",
    monthlySpend: "$310k",
    date: "2026-02-09",
    source: "LinkedIn organic",
    state: "awaiting_approval",
    signalScore: 0.96,
    note: "Testimonial draft sent. Wants final review before publish.",
  },
  {
    id: "in_004",
    type: "demo",
    person: "Priya Anand",
    role: "Head of AP",
    company: "Lumen Logistics",
    companyDomain: "lumenlogistics.io",
    monthlySpend: "$540k",
    date: "2026-02-09",
    source: "Google Ad · AP automation",
    state: "pending",
    signalScore: 0.88,
    note: "Attended demo. Went silent — high MRR potential.",
  },
  {
    id: "in_005",
    type: "onboarding",
    person: "James Wu",
    role: "Founder",
    company: "Kettle & Fire Coffee",
    companyDomain: "kettlefire.co",
    monthlySpend: "$44k",
    date: "2026-02-08",
    source: "Podcast attribution",
    state: "approved",
    signalScore: 0.92,
    note: "Loved onboarding. Approved a full customer testimonial quote.",
  },
  {
    id: "in_006",
    type: "webinar",
    person: "Diane Morales",
    role: "CFO",
    company: "Cirrus Health",
    companyDomain: "cirrushealth.co",
    monthlySpend: "$220k",
    date: "2026-02-07",
    source: "Ramp-Uplaud co-hosted webinar",
    state: "prompt_sent",
    signalScore: 0.83,
    note: "Attended 42 min. Q&A about compliance in healthcare payments.",
  },
  {
    id: "in_007",
    type: "cs_checkin",
    person: "Ethan Grant",
    role: "Head of Finance",
    company: "Palermo Print",
    companyDomain: "palermoprint.com",
    monthlySpend: "$78k",
    date: "2026-02-06",
    source: "Renewal CS motion",
    state: "amplified",
    signalScore: 0.9,
    note: "Renewed 2yr. Testimonial amplified on LinkedIn + Reddit.",
  },
  {
    id: "in_008",
    type: "qbr",
    person: "Sara Kim",
    role: "COO",
    company: "Trellis SaaS",
    companyDomain: "trellis.io",
    monthlySpend: "$412k",
    date: "2026-02-05",
    source: "Quarterly business review",
    state: "story_drafted",
    signalScore: 0.95,
    note: "QBR transcript surfaced 3 quotes worth activating.",
  },
  {
    id: "in_009",
    type: "event",
    person: "Malik Reyes",
    role: "VP Ops",
    company: "Bolt Manufacturing",
    companyDomain: "boltmfg.co",
    monthlySpend: "$680k",
    date: "2026-02-03",
    source: "CFO Summit Chicago",
    state: "pending",
    signalScore: 0.86,
    note: "Booth conversation. Not yet in CRM.",
  },
  {
    id: "in_010",
    type: "trial",
    person: "Nina Cortez",
    role: "Controller",
    company: "Meadowlark Foods",
    companyDomain: "meadowlark.co",
    monthlySpend: "$122k",
    date: "2026-02-02",
    source: "Referral from customer",
    state: "feedback_received",
    signalScore: 0.89,
    note: "Impressed with the vendor lookup. Feedback captured, testimonial draft pending.",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  CONVERSATION INTELLIGENCE                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
export const CONVERSATION_SOURCES = [
  { id: "zoom_ai", label: "Zoom AI Companion", connected: true, syncs: 42, color: "#2d8cff" },
  { id: "gong", label: "Gong", connected: true, syncs: 128, color: "#8236f7" },
  { id: "fireflies", label: "Fireflies.ai", connected: true, syncs: 61, color: "#f97316" },
  { id: "fathom", label: "Fathom", connected: false, syncs: 0, color: "#0ea5e9" },
  { id: "hubspot", label: "HubSpot Meetings", connected: true, syncs: 34, color: "#ff7a59" },
];

export const CONVERSATIONS = [
  {
    id: "cv_001",
    interactionId: "in_001",
    type: "demo",
    title: "Blueprint Robotics · Demo",
    person: "Rohan Sethi",
    role: "VP Finance",
    company: "Blueprint Robotics",
    duration: "42 min",
    date: "2026-02-11",
    source: "Gong",
    aeName: "Emma Rodriguez",
    sentiment: "positive",
    signalScore: 0.94,
    status: "signals_extracted",
    signals: {
      motivations: [
        "Wants to earn Amex MR points on $180k/mo vendor spend",
        "Frustrated with current wire fees eating rewards",
      ],
      painPoints: [
        "Current AP tool doesn't support 1099 vendors on cards",
        "Manual reconciliation between AP and rewards ledger",
      ],
      buyingSignals: [
        "Asked about 1099 vendor limits — buying-phase question",
        "Requested pricing for teams of 8",
        "Wants pilot before EOQ",
      ],
      objections: [
        "Legal team needs proof of PCI DSS Level 1",
        "Wants confirmation on QuickBooks bidirectional sync",
      ],
      customerLanguage: [
        '"Points that actually pay for themselves"',
        '"I don\'t want to babysit reconciliation"',
      ],
      productFeedback: [
        "Vendor lookup felt fast — would love bulk-add via CSV",
      ],
      faqs: [
        "Do you support Amex Charge cards or only credit cards?",
      ],
    },
    draftedStory: {
      status: "draft",
      body: `We were leaving $28k/year in points on the table because our current AP tool couldn't run vendor payments through our Amex. PayRewards fixed that in 20 minutes — I moved $180k of monthly spend to the card, and the rewards ledger now reconciles itself against QuickBooks.\n\nIt's the rare AP tool that actually pays for itself.`,
      attribution: "Rohan S., VP Finance, Blueprint Robotics",
      approvalRequestedAt: null,
      approvedAt: null,
    },
  },
  {
    id: "cv_002",
    interactionId: "in_003",
    type: "trial",
    title: "Halo Skincare · Trial kickoff",
    person: "Marcus Beltran",
    role: "CFO",
    company: "Halo Skincare",
    duration: "31 min",
    date: "2026-02-09",
    source: "Zoom AI",
    aeName: "Tim Alvarez",
    sentiment: "positive",
    signalScore: 0.96,
    status: "awaiting_approval",
    signals: {
      motivations: [
        "Wants a single card program across US + Canada operations",
        "Board wants a rewards P&L line item for the first time",
      ],
      painPoints: [
        "Bill.com wouldn't process CA GST invoices via card",
        "Rewards leakage estimated at $63k/yr",
      ],
      buyingSignals: [
        "Fast-tracked security review",
        "Requested contract redlines by end of week",
      ],
      objections: [],
      customerLanguage: [
        '"$63k of rewards leakage we couldn\'t capture"',
        '"For the first time, our card program has a P&L line"',
      ],
      productFeedback: [
        "Wants earn-rate simulator on the marketing site",
      ],
      faqs: [
        "Do you support cross-border GST vendors?",
      ],
    },
    draftedStory: {
      status: "awaiting_approval",
      body: `We were leaving $63k/yr in rewards on the table because our AP tool wouldn't run cross-border GST vendors on our card. PayRewards handled US + Canada from day one, and for the first time our card program has a P&L line item the board asks about.`,
      attribution: "Marcus B., CFO, Halo Skincare",
      approvalRequestedAt: "2026-02-10T14:20:00Z",
      approvedAt: null,
    },
  },
  {
    id: "cv_003",
    interactionId: "in_005",
    type: "onboarding",
    title: "Kettle & Fire Coffee · Onboarding",
    person: "James Wu",
    role: "Founder",
    company: "Kettle & Fire Coffee",
    duration: "38 min",
    date: "2026-02-08",
    source: "Fireflies.ai",
    aeName: "Priya Menon",
    sentiment: "very-positive",
    signalScore: 0.92,
    status: "approved",
    signals: {
      motivations: [
        "Solo-founder, needs weekend-proof automation",
      ],
      painPoints: [
        "Was manually paying green-coffee suppliers via ACH",
      ],
      buyingSignals: [],
      objections: [],
      customerLanguage: [
        '"Onboarding took less time than a coffee tasting"',
        '"Now every roast batch pays for itself in points"',
      ],
      productFeedback: [
        "Vendor auto-detect from QBO was magic",
      ],
      faqs: [],
    },
    draftedStory: {
      status: "approved",
      body: `Onboarding took less time than a coffee tasting. Now every roast batch pays for itself in Amex points — I've saved 6 hours a month and stopped paying ACH fees.`,
      attribution: "James W., Founder, Kettle & Fire Coffee",
      approvalRequestedAt: "2026-02-08T18:00:00Z",
      approvedAt: "2026-02-09T09:12:00Z",
    },
  },
  {
    id: "cv_004",
    interactionId: "in_008",
    type: "qbr",
    title: "Trellis SaaS · Q1 QBR",
    person: "Sara Kim",
    role: "COO",
    company: "Trellis SaaS",
    duration: "58 min",
    date: "2026-02-05",
    source: "Gong",
    aeName: "Dev Patel",
    sentiment: "positive",
    signalScore: 0.95,
    status: "signals_extracted",
    signals: {
      motivations: [
        "Wants to hit $6M ARR — rewards became a hidden lever",
      ],
      painPoints: [
        "AWS + hosting invoices exceeded card limit — needed higher line",
      ],
      buyingSignals: [
        "Requested add-on: AI approval workflows",
      ],
      objections: [],
      customerLanguage: [
        '"$142k of AWS spend suddenly earns points"',
        '"Rewards became a hidden lever for our EBITDA"',
      ],
      productFeedback: [
        "Wants approval routing based on vendor category",
      ],
      faqs: [],
    },
    draftedStory: {
      status: "draft",
      body: `$142k of monthly AWS spend now earns Amex points instead of vanishing to a wire. Rewards became a hidden lever for our EBITDA — the CFO literally added a rewards line to the quarterly board deck.`,
      attribution: "Sara K., COO, Trellis SaaS",
      approvalRequestedAt: null,
      approvedAt: null,
    },
  },
  {
    id: "cv_005",
    interactionId: "in_004",
    type: "demo",
    title: "Lumen Logistics · Demo",
    person: "Priya Anand",
    role: "Head of AP",
    company: "Lumen Logistics",
    duration: "35 min",
    date: "2026-02-09",
    source: "Gong",
    aeName: "Emma Rodriguez",
    sentiment: "neutral-warm",
    signalScore: 0.88,
    status: "signals_extracted",
    signals: {
      motivations: [
        "Vendor payment cycle is 60+ days across freight carriers",
      ],
      painPoints: [
        "Carriers demand ACH — no card acceptance",
      ],
      buyingSignals: [
        "Sent PayRewards demo recording to CFO",
      ],
      objections: [
        "Carriers won't accept card payments directly",
      ],
      customerLanguage: [
        '"We push $540k a month — every basis point matters"',
      ],
      productFeedback: [
        "Would love a 'vendor coverage' checker before signing",
      ],
      faqs: [
        "How do you handle vendors that refuse cards?",
      ],
    },
    draftedStory: null,
  },
  {
    id: "cv_006",
    interactionId: "in_007",
    type: "cs_checkin",
    title: "Palermo Print · Renewal check-in",
    person: "Ethan Grant",
    role: "Head of Finance",
    company: "Palermo Print",
    duration: "22 min",
    date: "2026-02-06",
    source: "Fireflies.ai",
    aeName: "Priya Menon",
    sentiment: "very-positive",
    signalScore: 0.9,
    status: "amplified",
    signals: {
      motivations: [
        "Renewed for 2 years — wants preferred pricing on higher tier",
      ],
      painPoints: [],
      buyingSignals: [
        "Willing to be a public reference",
      ],
      objections: [],
      customerLanguage: [
        '"We just bought a $12k espresso machine with the points we earned"',
      ],
      productFeedback: [
        "Wants a 'CFO summary' PDF export",
      ],
      faqs: [],
    },
    draftedStory: {
      status: "approved",
      body: `We just bought a $12k commercial espresso machine with the Amex points we earned paying our paper suppliers on PayRewards. Best AP decision we made this year — and it costs us nothing.`,
      attribution: "Ethan G., Head of Finance, Palermo Print",
      approvalRequestedAt: "2026-01-30T10:00:00Z",
      approvedAt: "2026-01-31T15:00:00Z",
    },
  },
  {
    id: "cv_007",
    interactionId: "in_010",
    type: "trial",
    title: "Meadowlark Foods · Trial call",
    person: "Nina Cortez",
    role: "Controller",
    company: "Meadowlark Foods",
    duration: "27 min",
    date: "2026-02-02",
    source: "Zoom AI",
    aeName: "Tim Alvarez",
    sentiment: "positive",
    signalScore: 0.89,
    status: "signals_extracted",
    signals: {
      motivations: [
        "Was referred by a happy PayRewards customer — high trust already",
      ],
      painPoints: [
        "Legacy AP tool couldn't do multi-entity",
      ],
      buyingSignals: [
        "Trial converted mid-call",
      ],
      objections: [],
      customerLanguage: [
        '"The vendor lookup is uncanny"',
      ],
      productFeedback: [],
      faqs: [],
    },
    draftedStory: {
      status: "draft",
      body: `A friend told me to just try PayRewards for a month. Two weeks in and I've paid $61k of vendor invoices on our card and earned enough points to cover a full team offsite. The vendor lookup is uncanny.`,
      attribution: "Nina C., Controller, Meadowlark Foods",
      approvalRequestedAt: null,
      approvedAt: null,
    },
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  REVIEWS — same schema as before, PayRewards content                      */
/* ────────────────────────────────────────────────────────────────────────── */
export const REVIEW_SOURCES = [
  { id: "g2", label: "G2", connected: true, count: 218, color: "#e35b3a" },
  { id: "capterra", label: "Capterra", connected: true, count: 96, color: "#ff9d28" },
  { id: "google", label: "Google Reviews", connected: true, count: 172, color: "#4285F4" },
  { id: "trustpilot", label: "Trustpilot", connected: false, count: 0, color: "#00b67a" },
  { id: "csv", label: "CSV / Flat file", connected: true, count: 41, color: "#6d46c6" },
];

export const REVIEWS = [
  {
    id: "rv_001",
    customer: "Rohan Sethi",
    handle: "@rsethi",
    rating: 5,
    source: "G2",
    date: "2026-02-08",
    sentiment: "positive",
    tags: ["amex", "reconciliation", "1099-vendors"],
    title: "The rare AP tool that pays for itself",
    body:
      "We moved $180k/mo of vendor payments to Amex through PayRewards. QuickBooks sync just works — the rewards ledger reconciles itself. We recouped the annual fee in month one.",
    verified: true,
    location: "Austin, TX",
    ltv: "$18,400 subscription + rewards",
  },
  {
    id: "rv_002",
    customer: "Marcus Beltran",
    handle: "@mbeltran",
    rating: 5,
    source: "Capterra",
    date: "2026-02-05",
    sentiment: "positive",
    tags: ["cross-border", "canada", "cfo"],
    title: "$63k/yr of rewards leakage recovered",
    body:
      "Our CFO added a rewards P&L line for the first time. PayRewards processed cross-border GST vendors that Bill.com wouldn't touch. Board asks about it every quarter now.",
    verified: true,
    location: "San Francisco, CA",
    ltv: "$24,900 subscription + rewards",
  },
  {
    id: "rv_003",
    customer: "Sara Kim",
    handle: "@sarakim",
    rating: 5,
    source: "G2",
    date: "2026-02-02",
    sentiment: "positive",
    tags: ["aws", "saas", "ebitda"],
    title: "$142k of AWS spend suddenly earns points",
    body:
      "Rewards became a hidden lever for our EBITDA. We route AWS + hosting invoices through PayRewards — points show up in our Amex account within 48h. Zero engineering required.",
    verified: true,
    location: "New York, NY",
    ltv: "$31,000 subscription + rewards",
  },
  {
    id: "rv_004",
    customer: "James Wu",
    handle: "@jwu",
    rating: 5,
    source: "Google",
    date: "2026-01-29",
    sentiment: "positive",
    tags: ["onboarding", "founder", "quickbooks"],
    title: "Onboarding took less time than a coffee tasting",
    body:
      "Solo founder — I was manually paying green-coffee suppliers via ACH. PayRewards auto-detected every vendor from my QBO. 20 minutes later I was earning Amex points on every roast batch.",
    verified: true,
    location: "Portland, OR",
    ltv: "$6,400 subscription + rewards",
  },
  {
    id: "rv_005",
    customer: "Ethan Grant",
    handle: "@egrant",
    rating: 5,
    source: "Capterra",
    date: "2026-01-24",
    sentiment: "positive",
    tags: ["renewal", "espresso-machine", "print"],
    title: "Bought a $12k espresso machine with our AP points",
    body:
      "Two years in, PayRewards is still the best AP decision we've made. We just bought a commercial espresso machine with Amex points earned paying paper suppliers.",
    verified: true,
    location: "Chicago, IL",
    ltv: "$11,600 subscription + rewards",
  },
  {
    id: "rv_006",
    customer: "Nina Cortez",
    handle: "@ncortez",
    rating: 4,
    source: "G2",
    date: "2026-01-20",
    sentiment: "positive",
    tags: ["vendor-lookup", "referral"],
    title: "The vendor lookup is uncanny",
    body:
      "Referred by a friend, converted mid-trial call. Paid $61k of vendor invoices in two weeks and covered a full team offsite with points. Wish there was multi-entity from day one.",
    verified: true,
    location: "Denver, CO",
    ltv: "$9,800 subscription + rewards",
  },
  {
    id: "rv_007",
    customer: "Diane Morales",
    handle: "@dmorales",
    rating: 5,
    source: "G2",
    date: "2026-01-15",
    sentiment: "positive",
    tags: ["healthcare", "compliance"],
    title: "Compliance-first AP with card rewards. Finally.",
    body:
      "As a healthcare CFO, compliance was non-negotiable. PayRewards has SOC 2 + PCI Level 1, and my controller earned $28k of Amex points in 90 days paying medical suppliers.",
    verified: true,
    location: "Boston, MA",
    ltv: "$22,400 subscription + rewards",
  },
  {
    id: "rv_008",
    customer: "Malik Reyes",
    handle: "@mreyes",
    rating: 5,
    source: "Google",
    date: "2026-01-10",
    sentiment: "positive",
    tags: ["manufacturing", "high-volume"],
    title: "Pushed $680k/mo through it, no hiccups",
    body:
      "Bolt Manufacturing pays 214 vendors monthly. PayRewards handles the whole book on Amex — points feed straight to our travel budget. Growth without spending more.",
    verified: true,
    location: "Nashville, TN",
    ltv: "$34,800 subscription + rewards",
  },
  {
    id: "rv_009",
    customer: "Kavita Iyer",
    handle: "@kiyer",
    rating: 5,
    source: "Capterra",
    date: "2026-01-06",
    sentiment: "positive",
    tags: ["bill-com-switch", "interior-design"],
    title: "Switched from Bill.com — never looking back",
    body:
      "Bill.com couldn't run our vendor payments on card. PayRewards did in 20 minutes. Our interior design projects fund themselves in points.",
    verified: true,
    location: "Seattle, WA",
    ltv: "$8,900 subscription + rewards",
  },
  {
    id: "rv_010",
    customer: "Omar Khalil",
    handle: "@okhalil",
    rating: 5,
    source: "G2",
    date: "2026-01-02",
    sentiment: "positive",
    tags: ["ecommerce", "shopify"],
    title: "Perfect for high-consideration Shopify brands",
    body:
      "We pay 3PLs, warehouses, and marketing agencies. PayRewards routes it all to our Chase Ink. Points cover our entire founder travel budget quarterly.",
    verified: true,
    location: "London, UK",
    ltv: "$19,700 subscription + rewards",
  },
  {
    id: "rv_011",
    customer: "Sophie Laurent",
    handle: "@slaurent",
    rating: 4,
    source: "Google",
    date: "2025-12-28",
    sentiment: "positive",
    tags: ["support", "responsive"],
    title: "Support team is genuinely great",
    body:
      "Every question got a same-day answer from a real human. Product works as advertised — I earn ~$4k in Amex MR every month I couldn't earn before.",
    verified: true,
    location: "Portland, OR",
    ltv: "$6,400 subscription + rewards",
  },
  {
    id: "rv_012",
    customer: "Kevin O'Brien",
    handle: "@kobrien",
    rating: 2,
    source: "Capterra",
    date: "2025-12-20",
    sentiment: "negative",
    tags: ["support", "delay", "outage"],
    title: "Rough December outage",
    body:
      "48-hour delay in point posting during peak December ended up costing us a quarterly rewards target. Support was polite but slow.",
    verified: true,
    location: "Phoenix, AZ",
    ltv: "$5,200 subscription + rewards",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  AGENTIC RECOMMENDATIONS PER REVIEW                                        */
/* ────────────────────────────────────────────────────────────────────────── */
export const AGENT_RECOMMENDATIONS = {
  rv_001: [
    { id: "r1", agent: "social", label: "Turn into LinkedIn AP-ops post", confidence: 0.94 },
    { id: "r2", agent: "referral", label: "Refer-a-controller campaign", confidence: 0.91 },
    { id: "r3", agent: "reddit", label: "Reply in r/Accounting thread", confidence: 0.82 },
    { id: "r4", agent: "attribution", label: "Feature in Google Ads RSA", confidence: 0.78 },
  ],
  rv_002: [
    { id: "r1", agent: "social", label: "X post: 'rewards P&L line'", confidence: 0.96 },
    { id: "r2", agent: "referral", label: "Cross-border CFO campaign", confidence: 0.93 },
    { id: "r3", agent: "reddit", label: "r/smallbusiness Canada thread", confidence: 0.79 },
  ],
  rv_003: [
    { id: "r1", agent: "social", label: "LinkedIn carousel: 'hidden EBITDA lever'", confidence: 0.91 },
    { id: "r2", agent: "attribution", label: "Meta lookalike from SaaS CFOs", confidence: 0.74 },
  ],
  rv_007: [
    { id: "r1", agent: "social", label: "Healthcare CFO testimonial · Instagram", confidence: 0.91 },
    { id: "r2", agent: "referral", label: "Refer-a-CFO (healthcare)", confidence: 0.87 },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  SOCIAL POSTS                                                              */
/* ────────────────────────────────────────────────────────────────────────── */
export const SOCIAL_POSTS = [
  {
    id: "sp_001",
    reviewId: "rv_001",
    platform: "linkedin",
    tone: "professional",
    status: "draft",
    scheduled: null,
    body:
      `"We moved $180k/mo of vendor payments to Amex through PayRewards. QuickBooks sync just works."\n\nRohan S., VP Finance @ Blueprint Robotics recouped his annual fee in month one.\n\nThat's what happens when AP tooling actually pays for itself →`,
    hashtags: ["#accountspayable", "#cfotools", "#amex"],
    predictedReach: "18.4k",
    predictedEngagement: "4.6%",
  },
  {
    id: "sp_002",
    reviewId: "rv_002",
    platform: "x",
    tone: "punchy",
    status: "scheduled",
    scheduled: "2026-02-14T09:00:00Z",
    body:
      `Marcus B., CFO @ Halo Skincare:\n\n"For the first time our card program has a P&L line item the board asks about."\n\n$63k/yr of rewards leakage — recovered.`,
    hashtags: ["#cfo", "#fintech"],
    predictedReach: "42.1k",
    predictedEngagement: "3.1%",
  },
  {
    id: "sp_003",
    reviewId: "rv_004",
    platform: "linkedin",
    tone: "founder-testimonial",
    status: "published",
    scheduled: "2026-02-01T14:00:00Z",
    body:
      `Solo founder testimonial ↓\n\nJames W. @ Kettle & Fire Coffee onboarded in less time than a coffee tasting. Every roast batch he ships now pays for itself in Amex points.\n\nSmall-business AP shouldn't be this fun. But here we are.`,
    hashtags: ["#founders", "#smallbusiness"],
    predictedReach: "22.8k",
    predictedEngagement: "5.9%",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  REFERRAL CAMPAIGNS                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
export const REFERRAL_CAMPAIGNS = [
  {
    id: "rc_001",
    name: "Refer-a-Controller",
    seedReviewIds: ["rv_001", "rv_005", "rv_009"],
    status: "active",
    incentive: "$500 statement credit each",
    channel: "Email + SMS",
    sent: 42,
    clicked: 28,
    booked: 14,
    converted: 6,
    revenue: "$118,400",
    started: "2026-01-14",
  },
  {
    id: "rc_002",
    name: "CFO Cohort · SaaS + Fintech",
    seedReviewIds: ["rv_002", "rv_003"],
    status: "active",
    incentive: "$1,000 charity match",
    channel: "LinkedIn DM + Email",
    sent: 96,
    clicked: 51,
    booked: 22,
    converted: 9,
    revenue: "$184,900",
    started: "2026-01-04",
  },
  {
    id: "rc_003",
    name: "Healthcare CFO Warm-Intros",
    seedReviewIds: ["rv_007"],
    status: "draft",
    incentive: "$750 team lunch",
    channel: "Email",
    sent: 0,
    clicked: 0,
    booked: 0,
    converted: 0,
    revenue: "$0",
    started: null,
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  REDDIT — B2B accounting + AP subreddits                                   */
/* ────────────────────────────────────────────────────────────────────────── */
export const REDDIT_THREADS = [
  {
    id: "rd_001",
    subreddit: "r/Accounting",
    title: "Is there any legit way to pay vendors with a credit card?",
    author: "u/APcontroller",
    posted: "3 hours ago",
    upvotes: 214,
    comments: 87,
    sentiment: "opportunity",
    matchScore: 0.94,
    excerpt:
      "We push $200k/mo through wires. Feels criminal to leave that many points on the table. Anyone actually made vendor-card payments work at scale...",
    suggestedReply: {
      reviewId: "rv_001",
      body:
        "Not affiliated, but a controller I know moved $180k/mo to Amex via PayRewards — QuickBooks sync just works and it reconciles the rewards ledger automatically. Worth an eval before assuming vendors have to accept cards directly.",
      tone: "helpful-neutral",
    },
  },
  {
    id: "rd_002",
    subreddit: "r/smallbusiness",
    title: "Bill.com alternative for a Canadian small biz?",
    author: "u/norcalfounder",
    posted: "6 hours ago",
    upvotes: 89,
    comments: 34,
    sentiment: "opportunity",
    matchScore: 0.91,
    excerpt:
      "Bill.com won't run our GST vendors on card. Losing thousands in rewards. What are folks using...",
    suggestedReply: {
      reviewId: "rv_002",
      body:
        "A CFO at Halo Skincare (US+Canada operations) just switched — PayRewards handles cross-border GST vendors on card. Reported $63k/yr of recovered rewards leakage. Different pricing model than Bill.com so worth pricing out.",
      tone: "helpful-neutral",
    },
  },
  {
    id: "rd_003",
    subreddit: "r/SaaS",
    title: "Anyone else running AWS bills through a card for points?",
    author: "u/saascfo",
    posted: "1 day ago",
    upvotes: 456,
    comments: 178,
    sentiment: "opportunity",
    matchScore: 0.87,
    excerpt:
      "Our AWS invoice is $140k. Feels like there should be a legit way to route this through Amex...",
    suggestedReply: {
      reviewId: "rv_003",
      body:
        "Sara @ Trellis SaaS is doing exactly this via PayRewards — $142k of monthly AWS earning MR. Zero engineering required, just points into your Amex account. Sharing because I looked into this for months and finally found something that worked.",
      tone: "helpful-neutral",
    },
  },
  {
    id: "rd_004",
    subreddit: "r/nonprofit",
    title: "AP tool that works with restricted funds + card rewards?",
    author: "u/ednonprofit",
    posted: "2 days ago",
    upvotes: 67,
    comments: 22,
    sentiment: "opportunity",
    matchScore: 0.83,
    excerpt:
      "We need vendor payment automation but our board wants any credit-card rewards routed transparently...",
    suggestedReply: {
      reviewId: "rv_005",
      body:
        "PayRewards has a decent nonprofit angle — the rewards ledger is fully separated and auditable. Palermo Print (2yr customer) uses the export for their board packet. Might fit your restricted-fund need.",
      tone: "empathetic",
    },
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  KPIs — Growth Engine metrics                                              */
/* ────────────────────────────────────────────────────────────────────────── */
export const KPIS = {
  interactionsCaptured: { value: 1521, delta: "+218 this week", trend: "up" },
  storiesApproved: { value: 172, delta: "+18 this week", trend: "up" },
  warmIntros: { value: 94, delta: "+12 this week", trend: "up" },
  postsPublished: { value: 128, delta: "+19 this week", trend: "up" },
  attributedPipeline: { value: "$1.42M", delta: "+22% MoM", trend: "up" },
  cacUplift: { value: "−34%", delta: "vs paid-only baseline", trend: "down-good" },
};

export const CHANNEL_ATTRIBUTION = [
  { channel: "Growth Activation (Demo → Testimonial)", touches: 641, converted: 14, revenue: "$412,800", cac: "$186" },
  { channel: "Referral Agent", touches: 152, converted: 6, revenue: "$118,400", cac: "$210" },
  { channel: "Social Amplification", touches: 1284, converted: 11, revenue: "$284,100", cac: "$412" },
  { channel: "Reddit Insert", touches: 89, converted: 5, revenue: "$92,800", cac: "$168" },
  { channel: "Paid Search + Reviews (baseline)", touches: 4210, converted: 4, revenue: "$135,900", cac: "$1,204" },
];

export const TREND_30D = [
  12, 14, 13, 18, 22, 20, 24, 28, 26, 30, 34, 32, 38, 41, 44, 42, 48, 52, 55, 58, 61, 64, 68, 72, 74, 78, 82, 86, 89, 92,
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  PAGE-LEVEL OUTCOMES — every page has one North Star + one Action         */
/* ────────────────────────────────────────────────────────────────────────── */
export const PAGE_OUTCOMES = {
  overview: {
    eyebrow: "Business Impact · Last 30 days",
    question: "How many new prospects did Uplaud activate — and where did they land?",
    northStar: {
      label: "Prospects activated",
      value: "388",
      delta: "+42% vs prior 30 days",
      trend: "up",
      attribution:
        "388 PayRewards demo attendees, trial users and QBR contacts turned into pipeline signals · 172 approved testimonials · 94 warm introductions · 48 SQLs created in HubSpot · 21 new customers.",
    },
    action: {
      title: "Activate 253 demo attendees who never received a feedback prompt",
      impact:
        "Projected against your current conversion rates: ~154 signals · ~37 warm intros · ~6 new customers",
      cta: "Activate demo attendees",
      to: "/business/interactions",
    },
  },
  interactions: {
    eyebrow: "Untapped Opportunities",
    question: "Which PayRewards leads represent the biggest untapped pipeline?",
    northStar: {
      label: "Unactivated leads",
      value: "253",
      delta: "across demos, trials, webinars, QBRs",
      trend: "up",
      attribution:
        "Demo attendees, trial users and QBR contacts who never received a feedback prompt. Every one has a name, company and monthly vendor spend in your CRM.",
    },
    action: {
      title: "Send feedback prompts to top 20 attendees by monthly vendor spend",
      impact:
        "Projected: ~12 testimonials · ~8 warm intros · ~2 new customers",
      cta: "Prompt top 20 now",
      to: null,
    },
  },
  conversations: {
    eyebrow: "Growth Signals",
    question: "What are your demo leads and customers telling you that can lift growth?",
    northStar: {
      label: "Acquisition-ready insights",
      value: "3",
      delta: "themes with buyer-language ready to lift Meta + Google ads",
      trend: "up",
      attribution:
        "Extracted from 61 demo, trial and QBR transcripts (Gong · Zoom AI · Fireflies). Every theme is traceable to source calls.",
    },
    action: {
      title: '"Rewards P&L line" language is repeated by 22 CFO buyers on call',
      impact:
        "Rewrite Meta CFO creative with this phrase — projected 1.7× CTR based on ad-copy benchmark",
      cta: "Send themes to Ads Manager",
      to: null,
    },
  },
  reviews: {
    eyebrow: "Trust Assets",
    question: "What customer trust have you captured — and what pipeline is it earning?",
    northStar: {
      label: "5★ testimonials captured",
      value: "218",
      delta: "12 high-LTV unactivated · $284k projected pipeline",
      trend: "up",
      attribution:
        "218 verified 5★ reviews across G2, Capterra and Google. 12 come from customers with monthly vendor spend > $100k that have never been amplified.",
    },
    action: {
      title: "Amplify Rohan S. (Blueprint Robotics · $180k/mo) as a LinkedIn testimonial",
      impact:
        "Highest-LTV unactivated advocate · projected 18.4k qualified reach",
      cta: "Draft the post",
      to: "/business/social",
    },
  },
  referrals: {
    eyebrow: "Warm Pipeline",
    question: "How many warm introductions did PayRewards customers deliver?",
    northStar: {
      label: "Warm introductions delivered",
      value: "94",
      delta: "42 clicked · 22 booked · 6 new customers",
      trend: "up",
      attribution:
        "Every warm intro is a named prospect in HubSpot sourced from an existing PayRewards customer. Blended CAC on this cohort: $210 vs $1,204 paid baseline.",
    },
    action: {
      title: "Launch Healthcare CFO warm-intros campaign (22 seeded reviewers)",
      impact:
        "Projected: ~14 accepts · ~6 booked calls · ~1–2 new customers based on last campaign performance",
      cta: "Launch campaign",
      to: null,
    },
  },
  social: {
    eyebrow: "Growth Amplification",
    question: "How much qualified reach did approved testimonials generate?",
    northStar: {
      label: "Qualified impressions from testimonials",
      value: "84.3k",
      delta: "27 demos booked · attributed via UTM",
      trend: "up",
      attribution:
        "Reach and demo-booking counts pulled from your LinkedIn + X analytics. Testimonial-anchored posts outperform brand posts by 3.2× on your channel.",
    },
    action: {
      title: "Amplify Marcus B.'s approved testimonial — highest projected demand this week",
      impact: "Projected 42.1k reach · 3.1% engagement · ~9 demo requests",
      cta: "Amplify to LinkedIn + X",
      to: null,
    },
  },
  reddit: {
    eyebrow: "High-Intent Demand",
    question: "How much high-intent demand was captured from existing customer proof?",
    northStar: {
      label: "Attributed demo requests",
      value: "8",
      delta: "from 13.6k impressions · 4 approved replies",
      trend: "up",
      attribution:
        "Demo bookings attributed to Reddit via UTM. Every reply is anchored to a real, named PayRewards customer testimonial — never generic marketing language.",
    },
    action: {
      title: "Approve 4 helpful replies drafted for r/Accounting & r/SaaS threads",
      impact: "Projected +3.4k impressions per approved reply · ~2 demo requests",
      cta: "Review drafts",
      to: null,
    },
  },
  import: {
    eyebrow: "Data Sources",
    question: "Where is your Growth Engine listening today?",
    northStar: {
      label: "Signals synced",
      value: "1,521",
      delta: "interactions · 687 reviews · live from 8 sources",
      trend: "up",
      attribution:
        "Connect a source once — Uplaud continuously extracts signals from every meeting and review and updates attribution against HubSpot.",
    },
    action: {
      title: "Connect Fathom to close the 12% of demo calls we're missing",
      impact: "Est. +42 conversations/mo · +$68k of pipeline visibility",
      cta: "Connect Fathom",
      to: null,
    },
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  TWO GROWTH LOOPS (Overview page)                                          */
/* ────────────────────────────────────────────────────────────────────────── */
export const GROWTH_LOOPS = {
  preCustomer: {
    title: "Pre-Customer Growth Loop",
    subtitle: "Paid Ads → Demo → Feedback → Testimonial → Referrals → New Prospects",
    revenue: "$531,200",
    revenueLabel: "Pipeline generated",
    cac: "$186",
    cacDelta: "84% below paid baseline",
    stages: [
      { label: "Paid ads", value: "48,210", hint: "clicks" },
      { label: "Demo booked", value: "892", hint: "1.8% of clicks" },
      { label: "Demo attended", value: "641", hint: "72% show-up" },
      { label: "Feedback captured", value: "388", hint: "60% of attendees" },
      { label: "Testimonials approved", value: "172", hint: "44% of captured" },
      { label: "New prospects", value: "48", hint: "Qualified ops" },
    ],
  },
  postCustomer: {
    title: "Post-Customer Advocacy Loop",
    subtitle: "Customer → Review → Referral → Social Proof → New Customers",
    revenue: "$887,300",
    revenueLabel: "Revenue attributed",
    cac: "$168",
    cacDelta: "86% below paid baseline",
    stages: [
      { label: "Customers", value: "218", hint: "Active accounts" },
      { label: "Reviews captured", value: "687", hint: "G2 + Capterra + Google" },
      { label: "Referrals sent", value: "152", hint: "Warm intros" },
      { label: "Social proof", value: "128", hint: "Posts amplified" },
      { label: "New customers", value: "21", hint: "This month" },
      { label: "Advocates", value: "14", hint: "NPS ≥ 9 + shared" },
    ],
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  CUSTOMER SIGNAL THEMES (aggregated across conversations)                  */
/* ────────────────────────────────────────────────────────────────────────── */
export const SIGNAL_THEMES = [
  {
    id: "theme_1",
    theme: '"Rewards P&L line"',
    category: "Buyer language",
    mentions: 22,
    conversations: 18,
    lift: "+72%",
    liftLabel: "vs current CFO ad creative",
    quote:
      "For the first time our card program has a P&L line item the board asks about.",
    quoteAttribution: "Marcus B., CFO",
    action: "Rewrite Meta CFO ad creative with this phrase",
  },
  {
    id: "theme_2",
    theme: '"Pays for itself"',
    category: "Value framing",
    mentions: 34,
    conversations: 28,
    lift: "+41%",
    liftLabel: "predicted CTR uplift",
    quote:
      "It's the rare AP tool that actually pays for itself.",
    quoteAttribution: "Rohan S., VP Finance",
    action: "Use as primary Meta headline for controller audience",
  },
  {
    id: "theme_3",
    theme: "Cross-border GST vendors",
    category: "Objection · addressable",
    mentions: 19,
    conversations: 14,
    lift: "$63k",
    liftLabel: "avg. recovered rewards leakage",
    quote:
      "Bill.com wouldn't process our GST vendors on card. PayRewards did in 20 minutes.",
    quoteAttribution: "Kavita I., Controller",
    action: "Create a comparison landing page targeting Bill.com refugees",
  },
];


/* ────────────────────────────────────────────────────────────────────────── */
/*  VALUE CHAIN — the Uplaud conversion path visualisation                   */
/* ────────────────────────────────────────────────────────────────────────── */
export const VALUE_CHAIN = {
  stages: [
    {
      id: "demos",
      label: "Demos attended",
      value: "641",
      subline: "Meta + Google",
      hint: "Source",
    },
    {
      id: "testimonials",
      label: "Testimonials extracted",
      value: "388",
      subline: "60% of demos",
      hint: "Feedback + Conversation Intelligence",
      conversionFromPrev: "60%",
    },
    {
      id: "approved",
      label: "Approved by customer",
      value: "172",
      subline: "44% of extracted",
      hint: "Customer-approved trust asset",
      conversionFromPrev: "44%",
    },
    {
      id: "campaigns",
      label: "Referral campaigns launched",
      value: "12",
      subline: "Seeded from 172 testimonials",
      hint: "Refer-a-Controller, CFO Cohort, etc.",
      conversionFromPrev: "—",
    },
    {
      id: "warm_leads",
      label: "Warm leads generated",
      value: "94",
      subline: "Warm intros in HubSpot",
      hint: "Named leads · enriched",
      conversionFromPrev: "55%",
    },
    {
      id: "converted",
      label: "New customers",
      value: "21",
      subline: "22% of warm leads",
      hint: "Closed-won this month",
      conversionFromPrev: "22%",
    },
  ],
  outcome: {
    label: "Estimated revenue impact",
    value: "$284k",
    subline: "ARR from Uplaud-sourced customers",
    cac: "$186",
    cacBaseline: "$1,204",
    cacDelta: "84.6% below paid baseline",
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  INTELLIGENT NEXT-BEST-ACTIONS  (rationale + segmentation + outcome)      */
/* ────────────────────────────────────────────────────────────────────────── */
export const SMART_NBA = {
  overview: {
    eyebrow: "Intelligent action",
    headline:
      "76 of your 253 unactivated demo attendees match every high-conversion signal",
    reasoning: [
      { label: "Monthly vendor spend", value: "≥ $200k · 76 people" },
      { label: "Sentiment on call", value: "positive · from Gong + Zoom AI" },
      { label: "Peer overlap", value: "1+ PayRewards customer in their LinkedIn network" },
    ],
    outcome:
      "Launch a segmented referral campaign to just this cohort. Projected: ~24 warm intros · ~5 new customers · ~$168k new ARR at a $210 CAC — vs $1,204 paid baseline.",
    cta: "Segment & launch to 76",
    to: "/business/interactions",
  },
  interactions: {
    eyebrow: "Intelligent action",
    headline:
      "22 controllers went silent after demo — they're your fastest path to referrals",
    reasoning: [
      { label: "Role match", value: "Controllers / VPs of Finance (highest referral rate)" },
      { label: "Signal score", value: "≥ 0.88 on transcript · buying-phase questions asked" },
      { label: "Peer overlap", value: "Every one has a PayRewards customer in their network" },
    ],
    outcome:
      "Re-engage with a controller-specific testimonial (Rohan S. → 5★, same persona). Projected ~11 responses · ~4 warm intros · ~1 new customer.",
    cta: "Re-engage the 22",
    to: null,
  },
  conversations: {
    eyebrow: "Intelligent action",
    headline:
      '"Rewards P&L line" is the exact language 22 CFO buyers used on call',
    reasoning: [
      { label: "Frequency", value: "22 mentions across 18 conversations" },
      { label: "Buyer type", value: "CFOs at $10M+ ARR SaaS + fintech" },
      { label: "Ad performance", value: "Current CFO creative CTR 1.2% · benchmark 2.0%+" },
    ],
    outcome:
      "Rewrite your Meta CFO creative with this phrase. Projected 1.7× CTR uplift · ~34 additional demos/mo based on your current spend.",
    cta: "Send to Ads Manager",
    to: null,
  },
  reviews: {
    eyebrow: "Intelligent action",
    headline:
      "Rohan S. is your highest-LTV unactivated 5★ — worth 3 warm intros",
    reasoning: [
      { label: "Customer LTV", value: "$18.4k/yr subscription + rewards" },
      { label: "Peer influence", value: "3 controllers in his network already booked demos" },
      { label: "Language match", value: '"Pays for itself" phrase = highest-CTR ad copy' },
    ],
    outcome:
      "Amplify as a LinkedIn testimonial with a founder-tone caption. Projected 18.4k qualified reach · ~3 warm intros · ~1 new customer.",
    cta: "Draft the post",
    to: "/business/social",
  },
  referrals: {
    eyebrow: "Intelligent action",
    headline:
      "The Healthcare CFO cohort has 82% peer-overlap — highest conversion probability",
    reasoning: [
      { label: "Seed advocate", value: "Diane Morales (Cirrus Health · 5★ · $220k/mo spend)" },
      { label: "Peer overlap", value: "18 of 22 target CFOs share ≥2 mutual LinkedIn connections" },
      { label: "Historical benchmark", value: "Peer-overlap ≥ 70% converts at 4.2× the baseline" },
    ],
    outcome:
      "Launch the campaign now. Projected: ~14 accepts · ~6 booked · ~1–2 new customers at CAC ~$168.",
    cta: "Launch campaign",
    to: null,
  },
  social: {
    eyebrow: "Intelligent action",
    headline:
      "Marcus B.'s CFO testimonial matches 3 open Meta audience segments",
    reasoning: [
      { label: "Audience fit", value: "US SaaS CFOs · Canadian ops · Bill.com refugees" },
      { label: "Language performance", value: '"$63k of rewards leakage" scored top 3% predicted CTR' },
      { label: "Freshness", value: "Approved 2 days ago · under the 7-day virality window" },
    ],
    outcome:
      "Amplify to LinkedIn + X now. Projected 42.1k qualified reach · ~9 demo requests based on your last 3 amplifications.",
    cta: "Amplify now",
    to: null,
  },
  reddit: {
    eyebrow: "Intelligent action",
    headline:
      "4 threads today match a specific PayRewards customer testimonial",
    reasoning: [
      { label: "Match quality", value: "94% average match score · anchored to real quotes" },
      { label: "Thread velocity", value: "3 posted in the last 6h · under-answered" },
      { label: "Historical benchmark", value: "Reply-per-thread produces 2 demo requests on average" },
    ],
    outcome:
      "Approve 4 helpful, source-anchored replies. Projected +13.6k impressions · ~8 attributed demo requests.",
    cta: "Review the 4 drafts",
    to: null,
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  WARM LEADS — real named leads with referrer + campaign + enrichment       */
/* ────────────────────────────────────────────────────────────────────────── */
export const WARM_LEAD_STAGES = {
  new: { label: "New", tone: "purple" },
  clicked: { label: "Clicked", tone: "purple" },
  booked: { label: "Meeting booked", tone: "amber" },
  demoed: { label: "Demoed", tone: "amber" },
  negotiation: { label: "In negotiation", tone: "amber" },
  converted: { label: "Closed-won", tone: "mint" },
  cold: { label: "Cold", tone: "grey" },
};

export const WARM_LEADS = [
  {
    id: "wl_001",
    name: "Aditi Bhandari",
    role: "Controller",
    company: "Tarrow Studios",
    companyDomain: "tarrow.studio",
    monthlySpend: "$210k",
    industry: "Design agency",
    headcount: 84,
    stage: "booked",
    hotness: 0.94,
    referrer: {
      name: "Rohan Sethi",
      company: "Blueprint Robotics",
      testimonialId: "rv_001",
      relationship: "Ex-colleague · 4 years",
    },
    campaign: "Refer-a-Controller",
    campaignId: "rc_001",
    receivedAt: "2026-02-11",
    enrichment: {
      linkedin: "linkedin.com/in/aditibhandari",
      recent: [
        "Announced Series A close last week ($14M · Sequoia India)",
        "Posted about AP tool frustration 2 days ago",
      ],
      companyMetrics: { arr: "$8M", growth: "+142% YoY" },
      buyingSignals: [
        "Reviewed pricing page 4 times in 48h",
        "Downloaded Bill.com comparison guide",
      ],
    },
    suggestedActions: [
      { id: "nurture_1", label: "Send Series A congrats + demo booking link" },
      { id: "nurture_2", label: "Loop in Rohan for a warm intro on LinkedIn" },
    ],
  },
  {
    id: "wl_002",
    name: "Julian Ortega",
    role: "CFO",
    company: "Aster Health Networks",
    companyDomain: "asterhealth.co",
    monthlySpend: "$540k",
    industry: "Healthcare · Multi-clinic",
    headcount: 320,
    stage: "demoed",
    hotness: 0.92,
    referrer: {
      name: "Diane Morales",
      company: "Cirrus Health",
      testimonialId: "rv_007",
      relationship: "Peer CFO network",
    },
    campaign: "Healthcare CFO Warm-Intros",
    campaignId: "rc_003",
    receivedAt: "2026-02-09",
    enrichment: {
      linkedin: "linkedin.com/in/julianortega",
      recent: [
        "New CFO — joined Aster 6 weeks ago from Steward Health",
        "Wrote a LinkedIn post: 'Every new CFO's first-90-days audit'",
      ],
      companyMetrics: { arr: "$62M revenue", growth: "+18% YoY" },
      buyingSignals: [
        "Attended full demo · asked about SOC 2 + PCI",
        "Requested contract redlines",
      ],
    },
    suggestedActions: [
      { id: "close_1", label: "Send SOC 2 + PCI packet + redline draft" },
      { id: "close_2", label: "Offer implementation credit tied to Q1 close" },
    ],
  },
  {
    id: "wl_003",
    name: "Meredith Zhao",
    role: "VP Finance",
    company: "Brightpath SaaS",
    companyDomain: "brightpath.io",
    monthlySpend: "$180k",
    industry: "SaaS · Series B",
    headcount: 128,
    stage: "negotiation",
    hotness: 0.96,
    referrer: {
      name: "Sara Kim",
      company: "Trellis SaaS",
      testimonialId: "rv_003",
      relationship: "COO peer network",
    },
    campaign: "CFO Cohort · SaaS + Fintech",
    campaignId: "rc_002",
    receivedAt: "2026-02-07",
    enrichment: {
      linkedin: "linkedin.com/in/meredithzhao",
      recent: [
        "Company hit $10M ARR milestone (announced on LinkedIn)",
        "Referenced 'card rewards on AWS' in a comment thread",
      ],
      companyMetrics: { arr: "$10M", growth: "+188% YoY" },
      buyingSignals: [
        "Legal review in progress",
        "Compared PayRewards to Ramp Bill Pay",
      ],
    },
    suggestedActions: [
      { id: "neg_1", label: "Send Sara Kim's ROI case study as decision anchor" },
      { id: "neg_2", label: "Schedule technical review with their FP&A" },
    ],
  },
  {
    id: "wl_004",
    name: "Colin Fraser",
    role: "Head of AP",
    company: "Northline Freight",
    companyDomain: "northline.co",
    monthlySpend: "$420k",
    industry: "Logistics",
    headcount: 210,
    stage: "clicked",
    hotness: 0.72,
    referrer: {
      name: "Malik Reyes",
      company: "Bolt Manufacturing",
      testimonialId: "rv_008",
      relationship: "Trade association contact",
    },
    campaign: "Refer-a-Controller",
    campaignId: "rc_001",
    receivedAt: "2026-02-10",
    enrichment: {
      linkedin: "linkedin.com/in/colinfraser",
      recent: [
        "Rebuilding AP team — hired 2 new specialists",
        "Company opened new distribution hub in TX",
      ],
      companyMetrics: { arr: "$42M revenue", growth: "+31% YoY" },
      buyingSignals: [
        "Clicked email · didn't book yet",
      ],
    },
    suggestedActions: [
      { id: "nurture_a", label: "Follow up with logistics case study" },
      { id: "nurture_b", label: "Auto-schedule reminder in 3 days" },
    ],
  },
  {
    id: "wl_005",
    name: "Rina Patel",
    role: "Founder",
    company: "Mesa Coffee Roasters",
    companyDomain: "mesaroasters.com",
    monthlySpend: "$62k",
    industry: "Food & Beverage",
    headcount: 22,
    stage: "converted",
    hotness: 1.0,
    referrer: {
      name: "James Wu",
      company: "Kettle & Fire Coffee",
      testimonialId: "rv_004",
      relationship: "Roaster's Guild",
    },
    campaign: "Refer-a-Controller",
    campaignId: "rc_001",
    receivedAt: "2026-01-28",
    enrichment: {
      linkedin: "linkedin.com/in/rinapatel",
      recent: ["Onboarded Feb 5 · earned first $2.4k in Amex MR"],
      companyMetrics: { arr: "$3.2M revenue", growth: "+64% YoY" },
      buyingSignals: [],
    },
    suggestedActions: [
      { id: "advocacy_1", label: "Ask for onboarding feedback → next referral" },
    ],
  },
  {
    id: "wl_006",
    name: "David Ng",
    role: "COO",
    company: "Verdant Materials",
    companyDomain: "verdantmat.com",
    monthlySpend: "$310k",
    industry: "Manufacturing",
    headcount: 165,
    stage: "new",
    hotness: 0.88,
    referrer: {
      name: "Malik Reyes",
      company: "Bolt Manufacturing",
      testimonialId: "rv_008",
      relationship: "Industry peer",
    },
    campaign: "CFO Cohort · SaaS + Fintech",
    campaignId: "rc_002",
    receivedAt: "2026-02-12",
    enrichment: {
      linkedin: "linkedin.com/in/davidng",
      recent: [
        "Raised $22M Series C (Insight Partners)",
        "Hiring VP Finance",
      ],
      companyMetrics: { arr: "$28M", growth: "+96% YoY" },
      buyingSignals: [
        "Introduction just landed · not yet clicked",
      ],
    },
    suggestedActions: [
      { id: "warm_1", label: "Send Series C congrats + one-line demo offer" },
      { id: "warm_2", label: "Ping Malik to reinforce the intro" },
    ],
  },
  {
    id: "wl_007",
    name: "Sophie Adekunle",
    role: "Head of Finance",
    company: "Lumo Legal Tech",
    companyDomain: "lumolegal.co",
    monthlySpend: "$140k",
    industry: "Legal SaaS",
    headcount: 62,
    stage: "booked",
    hotness: 0.85,
    referrer: {
      name: "Sara Kim",
      company: "Trellis SaaS",
      testimonialId: "rv_003",
      relationship: "Advisor network",
    },
    campaign: "CFO Cohort · SaaS + Fintech",
    campaignId: "rc_002",
    receivedAt: "2026-02-08",
    enrichment: {
      linkedin: "linkedin.com/in/sophieadekunle",
      recent: [
        "Company won Legal Innovation Award last month",
      ],
      companyMetrics: { arr: "$6M ARR", growth: "+72% YoY" },
      buyingSignals: [
        "Demo booked for next Tuesday",
      ],
    },
    suggestedActions: [
      { id: "prep_1", label: "Send Sara Kim's testimonial pre-demo" },
    ],
  },
  {
    id: "wl_008",
    name: "Erin Cavanaugh",
    role: "Controller",
    company: "Windrose Interiors",
    companyDomain: "windrose.design",
    monthlySpend: "$96k",
    industry: "Interior Design",
    headcount: 34,
    stage: "cold",
    hotness: 0.42,
    referrer: {
      name: "Kavita Iyer",
      company: "Northwind Interiors",
      testimonialId: "rv_009",
      relationship: "Design vertical peer",
    },
    campaign: "Refer-a-Controller",
    campaignId: "rc_001",
    receivedAt: "2026-01-20",
    enrichment: {
      linkedin: "linkedin.com/in/erincavanaugh",
      recent: ["No recent LinkedIn activity"],
      companyMetrics: { arr: "$2.1M revenue" },
      buyingSignals: [],
    },
    suggestedActions: [
      { id: "re_1", label: "Try a fresh angle — send interior-design case study" },
    ],
  },
];

