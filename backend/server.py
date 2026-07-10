from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import asyncio
import logging
import resend
import fal_client
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
LEAD_RECIPIENT_EMAIL = os.environ.get('LEAD_RECIPIENT_EMAIL', 'deepthi@uplaud.ai')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')
if os.environ.get('FAL_KEY'):
    os.environ['FAL_KEY'] = os.environ['FAL_KEY']  # ensure it's exported for fal_client

# Create the main app without a prefix
app = FastAPI(title="Uplaud AI API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=160)
    website: Optional[str] = Field(default=None, max_length=200)
    message: Optional[str] = Field(default=None, max_length=2000)


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: Optional[str] = None
    website: Optional[str] = None
    message: Optional[str] = None
    email_sent: bool = False
    email_error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Helpers ----------
def _escape_html(text: Optional[str]) -> str:
    if not text:
        return "—"
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _build_lead_email_html(lead: Lead) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e5e5;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e5e5e5;">
                <div style="font-size:12px;letter-spacing:2px;color:#525252;text-transform:uppercase;">Uplaud AI</div>
                <div style="font-size:22px;font-weight:600;color:#0a0a0a;margin-top:6px;">New demo request</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#0a0a0a;">
                  <tr><td style="padding:8px 0;color:#525252;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">{_escape_html(lead.name)}</td></tr>
                  <tr><td style="padding:8px 0;color:#525252;">Email</td><td style="padding:8px 0;font-weight:600;">{_escape_html(lead.email)}</td></tr>
                  <tr><td style="padding:8px 0;color:#525252;">Company</td><td style="padding:8px 0;">{_escape_html(lead.company)}</td></tr>
                  <tr><td style="padding:8px 0;color:#525252;">Website</td><td style="padding:8px 0;">{_escape_html(lead.website)}</td></tr>
                  <tr><td style="padding:8px 0;color:#525252;vertical-align:top;">Message</td><td style="padding:8px 0;white-space:pre-wrap;">{_escape_html(lead.message)}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e5e5e5;background:#fafaf7;font-size:12px;color:#737373;">
                Submitted at {lead.created_at.isoformat()} UTC · Lead ID {lead.id}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    """


async def _send_lead_email(lead: Lead) -> tuple[bool, Optional[str]]:
    if not resend.api_key:
        return False, "RESEND_API_KEY not configured"
    params = {
        "from": f"Uplaud AI <{SENDER_EMAIL}>",
        "to": [LEAD_RECIPIENT_EMAIL],
        "reply_to": lead.email,
        "subject": f"New demo request — {lead.name}"
        + (f" ({lead.company})" if lead.company else ""),
        "html": _build_lead_email_html(lead),
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Resend email sent: {result}")
        return True, None
    except Exception as e:
        logger.error(f"Failed to send lead email: {e}")
        return False, str(e)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Uplaud AI API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get('timestamp'), str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/leads", status_code=201)
async def create_lead(payload: LeadCreate):
    lead = Lead(**payload.model_dump())

    # Send email first (non-blocking style), then persist result
    sent, err = await _send_lead_email(lead)
    lead.email_sent = sent
    lead.email_error = err

    # Persist to Mongo as backup regardless of email result
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    try:
        await db.leads.insert_one(doc)
    except Exception as e:
        logger.error(f"Mongo insert failed for lead {lead.id}: {e}")

    if not sent:
        # Email failed but lead is saved — return 202 semantics as 201 with warning
        return {
            "id": lead.id,
            "status": "saved",
            "email_sent": False,
            "message": "Your request was received. We will be in touch shortly.",
        }

    return {
        "id": lead.id,
        "status": "sent",
        "email_sent": True,
        "message": "Thanks, we will be in touch shortly.",
    }


# ---------- Blog ----------
def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")[:80] or uuid.uuid4().hex[:8]


class BlogPostIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=120)
    excerpt: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    cover_image: Optional[str] = Field(default=None, max_length=500)
    tag: Optional[str] = Field(default=None, max_length=60)
    author: Optional[str] = Field(default="Uplaud Team", max_length=100)
    published: bool = True


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    excerpt: str
    content: str
    cover_image: Optional[str] = None
    tag: Optional[str] = None
    author: str = "Uplaud Team"
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def require_admin(x_admin_token: Optional[str] = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


def _serialize_post(doc: dict) -> dict:
    doc.pop("_id", None)
    for k in ("created_at", "updated_at"):
        v = doc.get(k)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


@api_router.get("/blog")
async def list_blog(limit: int = 20, offset: int = 0, include_unpublished: bool = False):
    limit = max(1, min(limit, 50))
    offset = max(0, offset)
    query = {} if include_unpublished else {"published": True}
    cursor = (
        db.blog_posts.find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
    )
    posts = await cursor.to_list(limit)
    return {"posts": [_serialize_post(p) for p in posts]}


@api_router.get("/blog/latest")
async def latest_blog(limit: int = 3):
    limit = max(1, min(limit, 10))
    cursor = (
        db.blog_posts.find({"published": True}, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    posts = await cursor.to_list(limit)
    return {"posts": [_serialize_post(p) for p in posts]}


@api_router.get("/blog/{slug}")
async def get_blog(slug: str):
    doc = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return _serialize_post(doc)


@api_router.post("/blog", status_code=201)
async def create_blog(payload: BlogPostIn, _: bool = Depends(require_admin)):
    slug = _slugify(payload.slug or payload.title)
    # ensure unique slug
    if await db.blog_posts.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    post = BlogPost(
        slug=slug,
        title=payload.title.strip(),
        excerpt=payload.excerpt.strip(),
        content=payload.content,
        cover_image=payload.cover_image,
        tag=payload.tag,
        author=payload.author or "Uplaud Team",
        published=payload.published,
    )
    doc = post.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.blog_posts.insert_one(doc)
    return _serialize_post(doc)


@api_router.put("/blog/{slug}")
async def update_blog(slug: str, payload: BlogPostIn, _: bool = Depends(require_admin)):
    existing = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")

    update = {
        "title": payload.title.strip(),
        "excerpt": payload.excerpt.strip(),
        "content": payload.content,
        "cover_image": payload.cover_image,
        "tag": payload.tag,
        "author": payload.author or existing.get("author", "Uplaud Team"),
        "published": payload.published,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # allow slug change
    new_slug = _slugify(payload.slug) if payload.slug else slug
    if new_slug != slug:
        if await db.blog_posts.find_one({"slug": new_slug}):
            new_slug = f"{new_slug}-{uuid.uuid4().hex[:6]}"
        update["slug"] = new_slug

    await db.blog_posts.update_one({"slug": slug}, {"$set": update})
    doc = await db.blog_posts.find_one({"slug": update.get("slug", slug)}, {"_id": 0})
    return _serialize_post(doc)


@api_router.delete("/blog/{slug}", status_code=204)
async def delete_blog(slug: str, _: bool = Depends(require_admin)):
    res = await db.blog_posts.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return None


@api_router.get("/admin/blog")
async def admin_list_blog(_: bool = Depends(require_admin), limit: int = 100, offset: int = 0):
    limit = max(1, min(limit, 200))
    cursor = (
        db.blog_posts.find({}, {"_id": 0})
        .sort("created_at", -1)
        .skip(max(0, offset))
        .limit(limit)
    )
    posts = await cursor.to_list(limit)
    return {"posts": [_serialize_post(p) for p in posts]}


ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB


@api_router.post("/admin/upload", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    _: bool = Depends(require_admin),
):
    if not os.environ.get('FAL_KEY'):
        raise HTTPException(status_code=503, detail="Image upload not configured (FAL_KEY missing)")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 8MB)")

    try:
        url = await fal_client.upload_async(contents, file.content_type)
    except Exception as e:
        logger.error(f"fal.ai upload failed: {e}")
        raise HTTPException(status_code=502, detail=f"CDN upload failed: {e}")

    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents),
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
