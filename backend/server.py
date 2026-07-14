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
    rating: int
    emoji: str = ""
    text: str
    date: str
    verified: bool = True
    channel: str = "whatsapp"
    referred: bool = False


class BusinessProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slug: str
    name: str
    tagline: str
    vertical: str  # education | health-wellness | legal | fintech | other
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
    keywords: List[Dict[str, Any]] = []
    trust_badges: List[Dict[str, str]] = []


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


# ---------- Startup: seed DB ----------
@app.on_event("startup")
async def seed_db():
    for biz in SEED_BUSINESSES:
        await db.businesses.update_one(
            {"slug": biz["slug"]},
            {"$set": biz},
            upsert=True,
        )
        # Seed reviews (only if none exist for this business)
        existing = await db.reviews.count_documents({"business_slug": biz["slug"]})
        if existing == 0:
            for r in SEED_REVIEWS:
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
            for cs in SEED_CASE_STUDIES:
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
