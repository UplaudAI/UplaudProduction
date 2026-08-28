from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_slug: str
    reviewer_name: str
    reviewer_slug: str
    reviewer_title: str = ""
    rating: int
    emoji: str = ""
    text: str
    date: str
    verified: bool = True
    verification_type: str = "purchase"  # purchase | demo
    channel: str = "whatsapp"
    referred: bool = False


class BusinessProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slug: str
    name: str
    tagline: str
    vertical: str  # education | health-wellness | legal | fintech | saas | other
    audience: str = "b2c"  # b2c | b2b
    category: str
    logo_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    location: str = ""
    website: str = ""
    founded: str = ""
    about: str = ""
    verified: bool = True
    claimed: bool = False
    total_reviews: int = 0
    avg_rating: float = 0.0
    total_referrals: int = 0
    unique_reviewers: int = 0
    trust_score: int = 92
    top_praise: str = ""
    keywords: List[Dict[str, Any]] = []
    trust_badges: List[Dict[str, str]] = []


class ReviewerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reviewer_slug: str
    bio: str = ""
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    follower_count: int = 0


class CaseStudy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_slug: str
    slug: str
    title: str
    excerpt: str
    hero_quote: str
    hero_quote_author: str
    body_html: str
    tag: str
    read_time: str = "3 min read"
    published: str
    source_review_ids: List[str] = []


# ---------- Seed data ----------
SEED_BUSINESSES: List[Dict[str, Any]] = [
    {
        "slug": "the-solved-skin",
        "name": "The Solved Skin",
        "tagline": "Clinically-formulated acne skincare, backed by 666 real customer stories.",
        "vertical": "health-wellness",
        "audience": "b2c",
        "category": "Skincare · D2C",
        "logo_url": None,
        "hero_image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1600&q=80",
        "location": "Bengaluru, India",
        "website": "thesolvedskin.com",
        "founded": "2021",
        "about": "The Solved Skin builds simple, science-backed routines for acne-prone skin. Every formula is clinically tested and iterated on with real customer feedback captured through Uplaud.",
        "verified": True,
        "claimed": True,
        "total_reviews": 666,
        "avg_rating": 4.6,
        "total_referrals": 214,
        "unique_reviewers": 612,
        "trust_score": 94,
        "top_praise": "effectiveness on active acne, gentle formula, dermatologist-level results at a D2C price.",
        "keywords": [
            {"word": "acne", "count": 396, "sentiment": "positive"},
            {"word": "facewash", "count": 98, "sentiment": "positive"},
            {"word": "clear skin", "count": 87, "sentiment": "positive"},
            {"word": "gentle", "count": 74, "sentiment": "positive"},
            {"word": "results", "count": 68, "sentiment": "positive"},
            {"word": "blemishes", "count": 61, "sentiment": "positive"},
            {"word": "packaging", "count": 42, "sentiment": "mixed"},
            {"word": "lightweight", "count": 39, "sentiment": "positive"},
            {"word": "salicylic", "count": 34, "sentiment": "positive"},
            {"word": "routine", "count": 31, "sentiment": "positive"},
        ],
        "trust_badges": [
            {"label": "Verified by Uplaud", "icon": "shield-check"},
            {"label": "612 unique reviewers", "icon": "users"},
            {"label": "Dermatologist tested", "icon": "flask-conical"},
            {"label": "Cruelty free", "icon": "leaf"},
        ],
    },
    {
        "slug": "ai-fiesta",
        "name": "AI Fiesta",
        "tagline": "One subscription. 9+ premium AI models. Trusted by 300+ teams to cut AI spend by up to 90%.",
        "vertical": "saas",
        "audience": "b2b",
        "category": "AI Productivity · B2B SaaS",
        "logo_url": None,
        "hero_image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80",
        "location": "Remote-first · Bengaluru & SF",
        "website": "aifiesta.ai",
        "founded": "2024",
        "about": "AI Fiesta gives teams side-by-side access to ChatGPT, Claude, Gemini, Perplexity, Grok and more — under one subscription. Backed by Y Combinator, built for teams that compare answers before they ship decisions, at half the cost of stacking individual AI subscriptions.",
        "verified": True,
        "claimed": True,
        "total_reviews": 348,
        "avg_rating": 4.7,
        "total_referrals": 96,
        "unique_reviewers": 312,
        "trust_score": 91,
        "top_praise": "side-by-side model comparison, transparent per-seat pricing well below stacking individual subscriptions, and fast support from the founding team.",
        "keywords": [
            {"word": "side-by-side", "count": 142, "sentiment": "positive"},
            {"word": "cost savings", "count": 118, "sentiment": "positive"},
            {"word": "onboarding", "count": 74, "sentiment": "positive"},
            {"word": "context switching", "count": 61, "sentiment": "positive"},
            {"word": "enterprise support", "count": 57, "sentiment": "positive"},
            {"word": "super fiesta", "count": 45, "sentiment": "positive"},
            {"word": "prompt enhancer", "count": 39, "sentiment": "positive"},
            {"word": "discovery call", "count": 33, "sentiment": "positive"},
            {"word": "pricing", "count": 29, "sentiment": "positive"},
            {"word": "token limits", "count": 22, "sentiment": "mixed"},
        ],
        "trust_badges": [
            {"label": "Verified by Uplaud", "icon": "shield-check"},
            {"label": "Y Combinator backed", "icon": "award"},
            {"label": "SOC 2 in progress", "icon": "lock"},
            {"label": "Enterprise-ready", "icon": "shield-check"},
        ],
    },
]

SEED_REVIEWS: List[Dict[str, Any]] = [
    {
        "reviewer_name": "Shweta",
        "reviewer_slug": "shweta",
        "rating": 5,
        "emoji": "🔥",
        "text": "The facewash has reduced the blemishes and also acne marks. Been using it for 6 weeks and my skin honestly feels new.",
        "date": "2026-06-20",
        "referred": True,
    },
    {
        "reviewer_name": "Prashant Singh",
        "reviewer_slug": "prashant-singh",
        "rating": 5,
        "emoji": "🔥",
        "text": "I tried so many products but my acne was not going, even salicylic acid facewash was not effective. Finally I tried The Solved Skin and yes it is 100% correct with its claim. Now my face is acne free.",
        "date": "2026-06-19",
        "referred": True,
    },
    {
        "reviewer_name": "Saumya Sharma",
        "reviewer_slug": "saumya-sharma",
        "rating": 4,
        "emoji": "😍",
        "text": "Good, lightweight and really effective on active acne. Wish the bottle was bigger — I finished mine in a month!",
        "date": "2026-06-19",
        "referred": False,
    },
    {
        "reviewer_name": "Sasi Kumar",
        "reviewer_slug": "sasi-kumar",
        "rating": 3,
        "emoji": "🙂",
        "text": "Works, but if I don't use it for one day, acne starts triggering again. Wish there was a maintenance version.",
        "date": "2026-06-19",
        "referred": False,
    },
    {
        "reviewer_name": "Arunabh Talukdar",
        "reviewer_slug": "arunabh-talukdar",
        "rating": 3,
        "emoji": "🙂",
        "text": "Product is genuinely great but the packaging needs work — cap came off in 2 days. Happy to talk over a call about a replacement.",
        "date": "2026-06-20",
        "referred": False,
    },
    {
        "reviewer_name": "Riya Menon",
        "reviewer_slug": "riya-menon",
        "rating": 5,
        "emoji": "🔥",
        "text": "I have PCOS-linked acne and nothing worked. Two months in, my forehead is clear. This is the first brand I've referred to my sister and two colleagues.",
        "date": "2026-06-18",
        "referred": True,
    },
    {
        "reviewer_name": "Aditya Verma",
        "reviewer_slug": "aditya-verma",
        "rating": 5,
        "emoji": "🔥",
        "text": "Dermat recommended salicylic-based cleansers. This one is gentle enough for daily use and my skin barrier didn't get destroyed like with cheaper drugstore ones.",
        "date": "2026-06-17",
        "referred": False,
    },
    {
        "reviewer_name": "Kavya Reddy",
        "reviewer_slug": "kavya-reddy",
        "rating": 4,
        "emoji": "😍",
        "text": "Loved the routine card that came with the order. Simple 3-step, easy to follow. Would love a moisturiser to complete the set!",
        "date": "2026-06-16",
        "referred": True,
    },
    {
        "reviewer_name": "Neha Kapoor",
        "reviewer_slug": "neha-kapoor",
        "rating": 5,
        "emoji": "🔥",
        "text": "My teenage son is using it and for the first time in years he actually cares about his skincare. Zero irritation, visible fade in marks in ~3 weeks.",
        "date": "2026-06-15",
        "referred": True,
    },
    {
        "reviewer_name": "Rohit Sharma",
        "reviewer_slug": "rohit-sharma",
        "rating": 5,
        "emoji": "🔥",
        "text": "Fantastic for oily, acne-prone Indian skin. Doesn't strip the face. My cystic breakouts are down 80% in 5 weeks.",
        "date": "2026-06-14",
        "referred": False,
    },
    {
        "reviewer_name": "Ananya Iyer",
        "reviewer_slug": "ananya-iyer",
        "rating": 4,
        "emoji": "😍",
        "text": "Best facewash I've used in the ₹500 range. Slight fragrance, wish it was unscented for sensitive-skin folks like me, but effectiveness is undeniable.",
        "date": "2026-06-13",
        "referred": False,
    },
    {
        "reviewer_name": "Vikram Joshi",
        "reviewer_slug": "vikram-joshi",
        "rating": 5,
        "emoji": "🔥",
        "text": "Honestly bought it because of a friend's WhatsApp referral. Best 30-second decision I made this year. My back-acne is finally under control.",
        "date": "2026-06-12",
        "referred": True,
    },
]

SEED_CASE_STUDIES: List[Dict[str, Any]] = [
    {
        "slug": "how-the-solved-skin-cleared-cystic-acne-in-5-weeks",
        "title": "How Rohit cleared cystic acne in 5 weeks with a single-product routine",
        "excerpt": "For years, Rohit stacked serums and cleansers with little to show. Then one referral, one product, and 35 days changed everything.",
        "hero_quote": "My cystic breakouts are down 80% in 5 weeks. It doesn't strip my face like anything else did.",
        "hero_quote_author": "Rohit Sharma · verified customer",
        "body_html": """
            <p>Before switching to The Solved Skin, Rohit had tried nine different acne products in eighteen months — including two dermat-prescribed retinoids and a handful of viral drugstore cleansers. Nothing stuck.</p>
            <h3>The turning point</h3>
            <p>A friend's WhatsApp review — captured and shared through Uplaud — landed in his inbox at exactly the right moment. Within a week he'd ordered his first bottle.</p>
            <h3>The routine</h3>
            <p>No stacking. No layering. Just the Solved facewash twice a day, and a simple moisturiser on top. That's it.</p>
            <blockquote>"Fantastic for oily, acne-prone Indian skin. Doesn't strip the face. My cystic breakouts are down 80% in 5 weeks."</blockquote>
            <h3>The outcome</h3>
            <p>By week 5, Rohit's active breakouts had reduced by an estimated 80%. His skin barrier — a common casualty of over-treatment — stayed intact. He has since referred three friends through Uplaud, two of whom converted into customers.</p>
        """,
        "tag": "Case study",
        "read_time": "4 min read",
        "published": "2026-06-14",
    },
    {
        "slug": "pcos-acne-a-two-month-story-from-riya",
        "title": "A PCOS acne story: two months, one product, zero flare-ups",
        "excerpt": "Riya spent three years cycling through hormonal-acne solutions. This one worked — and she referred it to three people.",
        "hero_quote": "I have PCOS-linked acne and nothing worked. Two months in, my forehead is clear.",
        "hero_quote_author": "Riya Menon · verified customer",
        "body_html": """
            <p>Hormonal acne — especially the kind that comes with PCOS — is notoriously resistant to surface-level skincare. Yet across our review corpus, PCOS mentions correlate strongly with 5-star outcomes on The Solved Skin.</p>
            <h3>What the data says</h3>
            <p>Of the 612 unique reviewers, 47 explicitly mention PCOS, hormonal or cyclical acne. 89% of those reviews are 4-star or above. 63% include the word "referred", "recommended", or "told my friend".</p>
            <blockquote>"This is the first brand I've referred to my sister and two colleagues."</blockquote>
            <h3>Why it works</h3>
            <p>Riya's routine was minimal by design. No actives layered on top. No fragrance. No stripping surfactants. Consistency beat complexity — a pattern we see repeated across the top-rated reviews.</p>
        """,
        "tag": "Case study",
        "read_time": "3 min read",
        "published": "2026-06-18",
    },
    {
        "slug": "the-referral-loop-behind-the-solved-skin",
        "title": "The referral loop behind The Solved Skin's 4.6-star growth",
        "excerpt": "35% of new customers arrive through a WhatsApp referral. Here's how one product built a compounding acquisition engine.",
        "hero_quote": "Honestly bought it because of a friend's WhatsApp referral. Best 30-second decision I made this year.",
        "hero_quote_author": "Vikram Joshi · verified customer",
        "body_html": """
            <p>Growth for The Solved Skin doesn't look like a typical D2C funnel. Paid CAC has been trending down for three consecutive quarters. Return-visitor share is rising. And a growing sliver of new orders arrive with the same referral tag: a WhatsApp link, powered by Uplaud.</p>
            <h3>The mechanic</h3>
            <p>After a 5-star review, Uplaud generates a personalised, one-tap referral card in the reviewer's voice. Sent to a friend on WhatsApp. Pre-sold. Warm.</p>
            <blockquote>"Rachel! You asked me about acne — I just reviewed The Solved Skin. My cysts are gone in 5 weeks."</blockquote>
            <h3>The compounding</h3>
            <p>214 referrals so far. 71% of the top advocates have referred at least one friend. And each spin of the flywheel gets cheaper — because trust doesn't inflate the way ad auctions do.</p>
        """,
        "tag": "Growth deep-dive",
        "read_time": "5 min read",
        "published": "2026-06-10",
    },
]

SEED_REVIEWS_AI_FIESTA: List[Dict[str, Any]] = [
    {
        "reviewer_name": "Rhea Kapoor",
        "reviewer_slug": "rhea-kapoor",
        "reviewer_title": "Head of Growth, Loop Studios",
        "rating": 5,
        "emoji": "🚀",
        "text": "Switched our entire growth team from 4 separate AI subscriptions to AI Fiesta. We're saving ~$1,800/month across 12 seats and nobody misses tab-switching.",
        "date": "2026-06-19",
        "verification_type": "purchase",
        "referred": True,
    },
    {
        "reviewer_name": "Marcus Chen",
        "reviewer_slug": "marcus-chen",
        "reviewer_title": "Founder, Nimbus Labs",
        "rating": 5,
        "emoji": "🔥",
        "text": "Booked the enterprise demo expecting a pitch. Got a genuine walkthrough of Super Fiesta and immediately saw how our PM team could ship faster comparisons.",
        "date": "2026-06-17",
        "verification_type": "demo",
        "referred": True,
    },
    {
        "reviewer_name": "Ananya Iyer",
        "reviewer_slug": "ananya-iyer",
        "reviewer_title": "Product Manager, Fintrail",
        "rating": 4,
        "emoji": "😍",
        "text": "Side-by-side comparison is the killer feature — catching where Gemini and Claude disagree before we ship a customer-facing answer.",
        "date": "2026-06-16",
        "verification_type": "purchase",
        "referred": False,
    },
    {
        "reviewer_name": "Devesh Rao",
        "reviewer_slug": "devesh-rao",
        "reviewer_title": "Engineering Lead, Northbeam",
        "rating": 5,
        "emoji": "🚀",
        "text": "3M tokens/month sounded like a lot until our whole eng team started using it for code review AND spec writing. Never hit the ceiling.",
        "date": "2026-06-15",
        "verification_type": "purchase",
        "referred": True,
    },
    {
        "reviewer_name": "Priya Menon",
        "reviewer_slug": "priya-menon",
        "reviewer_title": "Ops Director, Chronos Health",
        "rating": 3,
        "emoji": "🙂",
        "text": "Demo was thorough and the sales team was patient with our security questions, but we're still waiting on SOC 2 before we can roll it out company-wide.",
        "date": "2026-06-13",
        "verification_type": "demo",
        "referred": False,
    },
    {
        "reviewer_name": "Karan Malhotra",
        "reviewer_slug": "karan-malhotra",
        "reviewer_title": "CMO, Fenwick & Co",
        "rating": 5,
        "emoji": "🔥",
        "text": "Our content team compares Claude and Grok on every brief now — genuinely 2x faster than the old ChatGPT-only workflow.",
        "date": "2026-06-12",
        "verification_type": "purchase",
        "referred": True,
    },
    {
        "reviewer_name": "Sara Thomas",
        "reviewer_slug": "sara-thomas",
        "reviewer_title": "VP Marketing, HelloScout",
        "rating": 4,
        "emoji": "😍",
        "text": "Booked a discovery call after a colleague's referral. The team walked us through custom projects with system instructions — exactly what our brand voice needed.",
        "date": "2026-06-11",
        "verification_type": "demo",
        "referred": False,
    },
    {
        "reviewer_name": "Aditya Bhatt",
        "reviewer_slug": "aditya-bhatt",
        "reviewer_title": "CTO, Verlay",
        "rating": 5,
        "emoji": "🚀",
        "text": "Migrated 20 engineers off individual ChatGPT Plus + Claude Pro licenses. Half the cost, twice the visibility into who's using what.",
        "date": "2026-06-09",
        "verification_type": "purchase",
        "referred": True,
    },
    {
        "reviewer_name": "Neha Choudhary",
        "reviewer_slug": "neha-choudhary",
        "reviewer_title": "Founder, Petal & Co",
        "rating": 5,
        "emoji": "🔥",
        "text": "As a solo founder wearing five hats, having 9 models in one thread with shared context saves me hours every week.",
        "date": "2026-06-07",
        "verification_type": "purchase",
        "referred": False,
    },
    {
        "reviewer_name": "Rohan Bakshi",
        "reviewer_slug": "rohan-bakshi",
        "reviewer_title": "Head of Support, Quilltech",
        "rating": 4,
        "emoji": "😍",
        "text": "Discovery call convinced our support leadership this wasn't just another chat wrapper. Avatars feature is unexpectedly great for QA training scripts.",
        "date": "2026-06-05",
        "verification_type": "demo",
        "referred": True,
    },
    {
        "reviewer_name": "Ishaan Kapoor",
        "reviewer_slug": "ishaan-kapoor",
        "reviewer_title": "Growth Marketer, Driftwise",
        "rating": 5,
        "emoji": "🚀",
        "text": "Referred by a friend on WhatsApp, converted within a day. The pricing math alone — half of one premium subscription — made this an easy internal sell.",
        "date": "2026-06-03",
        "verification_type": "purchase",
        "referred": True,
    },
    {
        "reviewer_name": "Meera Nair",
        "reviewer_slug": "meera-nair",
        "reviewer_title": "Data Analyst, Loop Studios",
        "rating": 3,
        "emoji": "🙂",
        "text": "Solid tool, but our team occasionally hits token limits during heavy research sprints. Would love a team-pooled overage option.",
        "date": "2026-06-01",
        "verification_type": "purchase",
        "referred": False,
    },
]

SEED_CASE_STUDIES_AI_FIESTA: List[Dict[str, Any]] = [
    {
        "slug": "how-loop-studios-cut-ai-spend-by-1800-a-month",
        "title": "How Loop Studios cut AI spend by $1,800/month without losing a single model",
        "excerpt": "Twelve seats. Four subscriptions each. One consolidation call. Here's how a growth team simplified its entire AI stack.",
        "hero_quote": "We're saving ~$1,800/month across 12 seats and nobody misses tab-switching.",
        "hero_quote_author": "Rhea Kapoor · Head of Growth, Loop Studios · verified subscriber",
        "body_html": """
            <p>Before AI Fiesta, Loop Studios' 12-person growth team was running four separate premium AI subscriptions per seat — ChatGPT Plus, Claude Pro, Gemini Advanced, and Perplexity Pro — with zero visibility into who was actually using what.</p>
            <h3>The consolidation</h3>
            <p>Rhea Kapoor, Head of Growth, ran the numbers: over $2,600/month across scattered logins, expense reports and IT tickets. Onboarding took an afternoon per new hire.</p>
            <h3>The switch</h3>
            <p>One AI Fiesta enterprise plan replaced all four. Side-by-side comparison meant the team could sanity-check outputs across models before anything shipped to a client.</p>
            <blockquote>"We're saving ~$1,800/month across 12 seats and nobody misses tab-switching."</blockquote>
            <h3>The outcome</h3>
            <p>Three months in, Loop Studios has referred two other agencies through Uplaud, and their data analyst has become the loudest internal advocate — despite the occasional token-limit grumble during heavy research sprints.</p>
        """,
        "tag": "Case study",
        "read_time": "4 min read",
        "published": "2026-06-19",
    },
    {
        "slug": "verlay-migrated-20-engineers-half-the-cost",
        "title": "Verlay migrated 20 engineers off individual AI subscriptions — at half the cost",
        "excerpt": "A CTO's play-by-play on consolidating ChatGPT Plus and Claude Pro seats into one enterprise line item.",
        "hero_quote": "Half the cost, twice the visibility into who's using what.",
        "hero_quote_author": "Aditya Bhatt · CTO, Verlay · verified subscriber",
        "body_html": """
            <p>Verlay's engineering org had grown to 20 people, each expensing their own mix of ChatGPT Plus and Claude Pro licenses. Finance had no clean way to audit spend, and IT had no way to enforce which models handled sensitive code.</p>
            <h3>Why AI Fiesta</h3>
            <p>Aditya Bhatt, CTO, wanted one invoice, one admin console, and model-level usage visibility — without slowing down 20 engineers mid-sprint.</p>
            <blockquote>"Migrated 20 engineers off individual ChatGPT Plus + Claude Pro licenses. Half the cost, twice the visibility into who's using what."</blockquote>
            <h3>The rollout</h3>
            <p>Migration took a single sprint. Engineers kept their workflows — code review, spec writing, debugging — but now compared model outputs side by side before merging anything AI-assisted.</p>
            <h3>The result</h3>
            <p>Verlay cut its AI tooling line item in half while gaining an audit trail finance actually trusts.</p>
        """,
        "tag": "Growth deep-dive",
        "read_time": "5 min read",
        "published": "2026-06-15",
    },
    {
        "slug": "the-demo-that-convinced-nimbus-labs",
        "title": "The 30-minute demo that convinced Nimbus Labs to consolidate their AI stack",
        "excerpt": "Not every enterprise demo turns into a deal in the same call. This one did — here's the exact walkthrough that closed it.",
        "hero_quote": "Booked the enterprise demo expecting a pitch. Got a genuine walkthrough of Super Fiesta.",
        "hero_quote_author": "Marcus Chen · Founder, Nimbus Labs · verified demo attendee",
        "body_html": """
            <p>Marcus Chen, founder of Nimbus Labs, booked a discovery call skeptical it would be anything more than a sales pitch. Instead, the AI Fiesta team walked through Super Fiesta live, using one of Nimbus's own product questions.</p>
            <h3>What the demo showed</h3>
            <p>Automatic model selection, unified context across a multi-turn conversation, and the ability to request an alternative answer without losing the thread — all things Nimbus's PM team had been doing manually across five browser tabs.</p>
            <blockquote>"Booked the enterprise demo expecting a pitch. Got a genuine walkthrough of Super Fiesta and immediately saw how our PM team could ship faster comparisons."</blockquote>
            <h3>The close</h3>
            <p>Nimbus signed within the week. Marcus has since referred the AI Fiesta enterprise team to two portfolio founders in his network.</p>
        """,
        "tag": "Case study",
        "read_time": "3 min read",
        "published": "2026-06-08",
    },
]

REVIEWS_BY_SLUG: Dict[str, List[Dict[str, Any]]] = {
    "the-solved-skin": SEED_REVIEWS,
    "ai-fiesta": SEED_REVIEWS_AI_FIESTA,
}

CASE_STUDIES_BY_SLUG: Dict[str, List[Dict[str, Any]]] = {
    "the-solved-skin": SEED_CASE_STUDIES,
    "ai-fiesta": SEED_CASE_STUDIES_AI_FIESTA,
}

SEED_REVIEWER_PROFILES: List[Dict[str, Any]] = [
    {
        "reviewer_slug": "ananya-iyer",
        "bio": "Product manager by day, skincare enthusiast off the clock. Reviews things that actually work.",
        "instagram_url": "https://instagram.com/ananya.iyer",
        "linkedin_url": "https://linkedin.com/in/ananya-iyer-pm",
        "follower_count": 342,
    },
    {
        "reviewer_slug": "rohit-sharma",
        "bio": "Featured in a Solved Skin case study. Shares real skincare wins, no fluff.",
        "instagram_url": "https://instagram.com/rohit.sharma",
        "linkedin_url": None,
        "follower_count": 128,
    },
    {
        "reviewer_slug": "riya-menon",
        "bio": "PCOS advocate. Talks openly about hormonal acne and what actually worked for her.",
        "instagram_url": "https://instagram.com/riya.menon",
        "linkedin_url": None,
        "follower_count": 276,
    },
    {
        "reviewer_slug": "marcus-chen",
        "bio": "Founder @ Nimbus Labs. Evaluates every tool via a live demo before buying.",
        "instagram_url": None,
        "linkedin_url": "https://linkedin.com/in/marcuschen",
        "follower_count": 512,
    },
    {
        "reviewer_slug": "rhea-kapoor",
        "bio": "Head of Growth at Loop Studios. Obsessed with cutting SaaS spend without cutting quality.",
        "instagram_url": None,
        "linkedin_url": "https://linkedin.com/in/rheakapoor",
        "follower_count": 398,
    },
    {
        "reviewer_slug": "aditya-bhatt",
        "bio": "CTO at Verlay. Migrates teams off subscription sprawl for a living.",
        "instagram_url": None,
        "linkedin_url": "https://linkedin.com/in/adityabhatt",
        "follower_count": 231,
    },
]


# ---------- Startup: seed DB ----------
@app.on_event("startup")
async def seed_db():
    for rp in SEED_REVIEWER_PROFILES:
        await db.reviewer_profiles.update_one(
            {"reviewer_slug": rp["reviewer_slug"]},
            {"$set": rp},
            upsert=True,
        )
    for biz in SEED_BUSINESSES:
        await db.businesses.update_one(
            {"slug": biz["slug"]},
            {"$set": biz},
            upsert=True,
        )
        # Seed reviews (only if none exist for this business)
        existing = await db.reviews.count_documents({"business_slug": biz["slug"]})
        if existing == 0:
            for r in REVIEWS_BY_SLUG.get(biz["slug"], []):
                doc = {
                    "id": str(uuid.uuid4()),
                    "business_slug": biz["slug"],
                    "verified": True,
                    "channel": "whatsapp",
                    **r,
                }
                await db.reviews.insert_one(doc)
        # Seed case studies (only if none)
        existing_cs = await db.case_studies.count_documents({"business_slug": biz["slug"]})
        if existing_cs == 0:
            for cs in CASE_STUDIES_BY_SLUG.get(biz["slug"], []):
                doc = {
                    "id": str(uuid.uuid4()),
                    "business_slug": biz["slug"],
                    "source_review_ids": [],
                    **cs,
                }
                await db.case_studies.insert_one(doc)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Uplaud API"}


@api_router.get("/business/{slug}")
async def get_business(slug: str):
    biz = await db.businesses.find_one({"slug": slug}, {"_id": 0})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@api_router.get("/business/{slug}/reviews")
async def get_reviews(
    slug: str,
    rating: Optional[int] = Query(None, ge=1, le=5),
    sort: str = Query("recent"),  # recent | top | oldest
    q: Optional[str] = None,
    referred_only: bool = False,
    limit: int = 100,
):
    query: Dict[str, Any] = {"business_slug": slug}
    if rating:
        query["rating"] = rating
    if referred_only:
        query["referred"] = True
    if q:
        query["text"] = {"$regex": q, "$options": "i"}

    sort_field = "date"
    sort_dir = -1
    if sort == "top":
        sort_field = "rating"
        sort_dir = -1
    elif sort == "oldest":
        sort_dir = 1

    cursor = db.reviews.find(query, {"_id": 0}).sort(sort_field, sort_dir).limit(limit)
    reviews = await cursor.to_list(limit)
    return {"count": len(reviews), "reviews": reviews}


@api_router.get("/business/{slug}/stats")
async def get_stats(slug: str):
    biz = await db.businesses.find_one({"slug": slug}, {"_id": 0})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    reviews = await db.reviews.find({"business_slug": slug}, {"_id": 0}).to_list(1000)

    dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in reviews:
        dist[r["rating"]] = dist.get(r["rating"], 0) + 1

    total_seed = len(reviews) or 1
    scale = biz.get("total_reviews", total_seed) / total_seed
    scaled = {k: int(v * scale) for k, v in dist.items()}

    positive = sum(v for k, v in dist.items() if k >= 4)
    neutral = dist.get(3, 0)
    negative = sum(v for k, v in dist.items() if k <= 2)
    total = max(len(reviews), 1)
    sentiment = {
        "positive": round(positive / total * 100),
        "neutral": round(neutral / total * 100),
        "negative": round(negative / total * 100),
    }

    return {
        "total_reviews": biz.get("total_reviews", len(reviews)),
        "avg_rating": biz.get("avg_rating", 0),
        "total_referrals": biz.get("total_referrals", 0),
        "unique_reviewers": biz.get("unique_reviewers", 0),
        "trust_score": biz.get("trust_score", 90),
        "rating_distribution": scaled,
        "sentiment": sentiment,
        "keywords": biz.get("keywords", []),
        "top_praise": biz.get("top_praise", ""),
    }


@api_router.get("/business/{slug}/case-studies")
async def get_case_studies(slug: str):
    cursor = db.case_studies.find({"business_slug": slug}, {"_id": 0}).sort("published", -1)
    items = await cursor.to_list(50)
    return {"count": len(items), "case_studies": items}


@api_router.get("/business/{slug}/case-studies/{cs_slug}")
async def get_case_study(slug: str, cs_slug: str):
    cs = await db.case_studies.find_one({"business_slug": slug, "slug": cs_slug}, {"_id": 0})
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    return cs


@api_router.get("/reviewer/{reviewer_slug}")
async def get_reviewer_profile(reviewer_slug: str):
    reviews = await db.reviews.find({"reviewer_slug": reviewer_slug}, {"_id": 0}).sort("date", -1).to_list(1000)
    if not reviews:
        raise HTTPException(status_code=404, detail="Reviewer not found")

    business_slugs = list({r["business_slug"] for r in reviews})
    businesses = await db.businesses.find({"slug": {"$in": business_slugs}}, {"_id": 0}).to_list(100)
    biz_map = {b["slug"]: b for b in businesses}
    for r in reviews:
        b = biz_map.get(r["business_slug"])
        r["business_name"] = b["name"] if b else r["business_slug"]

    profile = await db.reviewer_profiles.find_one({"reviewer_slug": reviewer_slug}, {"_id": 0}) or {}

    total_reviews = len(reviews)
    avg_rating_given = round(sum(r["rating"] for r in reviews) / total_reviews, 1)
    total_referrals = sum(1 for r in reviews if r.get("referred"))
    verified_demo_count = sum(1 for r in reviews if r.get("verification_type") == "demo")
    member_since = min(r["date"] for r in reviews)
    reviewer_title = next((r.get("reviewer_title") for r in reviews if r.get("reviewer_title")), "")

    return {
        "reviewer_slug": reviewer_slug,
        "reviewer_name": reviews[0]["reviewer_name"],
        "reviewer_title": reviewer_title,
        "bio": profile.get("bio", ""),
        "instagram_url": profile.get("instagram_url"),
        "linkedin_url": profile.get("linkedin_url"),
        "follower_count": profile.get("follower_count", 0),
        "total_reviews": total_reviews,
        "avg_rating_given": avg_rating_given,
        "total_referrals": total_referrals,
        "verified_demo_count": verified_demo_count,
        "member_since": member_since,
        "businesses_reviewed": [
            {"slug": b["slug"], "name": b["name"], "category": b.get("category", "")} for b in businesses
        ],
        "reviews": reviews,
    }


@api_router.post("/reviewer/{reviewer_slug}/follow")
async def follow_reviewer(reviewer_slug: str):
    await db.reviewer_profiles.update_one(
        {"reviewer_slug": reviewer_slug},
        {"$inc": {"follower_count": 1}},
        upsert=True,
    )
    doc = await db.reviewer_profiles.find_one({"reviewer_slug": reviewer_slug}, {"_id": 0})
    return {"follower_count": doc.get("follower_count", 0)}


@api_router.post("/reviewer/{reviewer_slug}/unfollow")
async def unfollow_reviewer(reviewer_slug: str):
    doc = await db.reviewer_profiles.find_one({"reviewer_slug": reviewer_slug}, {"_id": 0})
    current = doc.get("follower_count", 0) if doc else 0
    new_count = max(0, current - 1)
    await db.reviewer_profiles.update_one(
        {"reviewer_slug": reviewer_slug},
        {"$set": {"follower_count": new_count}},
        upsert=True,
    )
    return {"follower_count": new_count}


class ReviewSubmit(BaseModel):
    reviewer_name: str
    rating: int
    text: str
    emoji: str = "😊"


@api_router.post("/business/{slug}/reviews")
async def submit_review(slug: str, payload: ReviewSubmit):
    biz = await db.businesses.find_one({"slug": slug})
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    doc = {
        "id": str(uuid.uuid4()),
        "business_slug": slug,
        "reviewer_name": payload.reviewer_name,
        "reviewer_slug": payload.reviewer_name.lower().replace(" ", "-"),
        "rating": max(1, min(5, payload.rating)),
        "emoji": payload.emoji,
        "text": payload.text,
        "date": datetime.now(timezone.utc).date().isoformat(),
        "verified": False,
        "channel": "web",
        "referred": False,
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "review": doc}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
