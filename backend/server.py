from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import re
import base64
import hashlib
import hmac
import json
import secrets
import uuid
import asyncio
import logging
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from docx import Document as DocxDocument
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from openai import OpenAI
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from collections import Counter

import airtable_client
import blob_storage
from airtable_client import (
    AirtableSourceCollisionError,
    AirtableSourceConflictError,
    AirtableSourceLookupError,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "uplaud-demo-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 168
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o")
# Airtable long-text cells support up to 100,000 characters. Keep a 10% safety
# margin so uploads fail clearly before a record write rather than at Airtable.
MAX_AIRTABLE_TRANSCRIPT_CHARS = 90_000
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_SHARE_TOKEN_ATTEMPTS = 5
ALLOWED_BLOG_IMAGE_TYPES = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
BLOG_IMAGE_FORMAT_TYPES = {
    "AVIF": "image/avif",
    "GIF": "image/gif",
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}

# Official OpenAI SDK client (user-provided key). Created once and reused.
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("uplaud")

app = FastAPI(title="Uplaud Growth Engine API")
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company: str
    approved: Optional[bool] = True


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class Insights(BaseModel):
    company_name: str = ""
    speaker_name: str = ""
    speaker_role: str = ""
    ae_name: str = ""
    sentiment_label: str = "Positive"
    signal_score: int = 0
    call_type: str = "Demo"
    summary: str = ""
    motivations: List[str] = []
    pain_points: List[str] = []
    buying_signals: List[str] = []
    objections: List[str] = []
    customer_language: List[str] = []
    product_feedback: List[str] = []
    faqs: List[str] = []


class SourceOut(BaseModel):
    id: str
    filename: str
    file_type: str
    client_name: str
    conversation_code: str
    source_name: str
    duration_min: int
    word_count: int
    status: str
    created_at: str
    insights: Optional[Insights] = None
    testimonial_draft: Optional[str] = None
    testimonial_is_verbatim: bool = True
    share_id: str = ""
    testimonial_status: str = "draft"
    approved_at: Optional[str] = None
    approval_requested_at: Optional[str] = None


class PublicTestimonial(BaseModel):
    share_id: str
    company_name: str
    brand: str = "PayRewards"
    speaker_name: str
    speaker_role: str
    testimonial: str
    status: str
    approved_at: Optional[str] = None


class PublicUpdate(BaseModel):
    testimonial_draft: str


class TestimonialUpdate(BaseModel):
    testimonial_draft: str


class EmailDraft(BaseModel):
    to: str
    subject: str
    body: str
    attachment_name: str


class EventLogRequest(BaseModel):
    event: str
    page: str = ""
    share_id: str = ""
    details: str = ""


class BlogPostIn(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: str
    content: str
    cover_image: Optional[str] = None
    tag: Optional[str] = None
    author: str = "Uplaud Team"
    published: bool = True


class BlogPostOut(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    cover_image: Optional[str] = None
    tag: Optional[str] = None
    author: str
    published: bool
    created_at: str


class LeadMagnetRequest(BaseModel):
    email: EmailStr
    slug: str


class BusinessProfileRequest(BaseModel):
    website: str


class BlogListResponse(BaseModel):
    posts: List[BlogPostOut]


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def is_work_email(email: str) -> bool:
    parts = email.lower().strip().split("@")
    if len(parts) < 2:
        return False
    domain = parts[-1]
    personal_domains = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
        "icloud.com", "mail.com", "zoho.com", "yandex.com", "protonmail.com",
        "proton.me", "gmx.com", "live.com", "msn.com", "me.com", "ymail.com"
    }
    return domain not in personal_domains


def derive_business_name(email: str) -> str:
    parts = email.lower().strip().split("@")
    if len(parts) < 2:
        return "My Company"
    domain = parts[-1]
    if domain.startswith("www."):
        domain = domain[4:]
    name_part = domain.split(".")[0]
    name_part = name_part.replace("-", " ").replace("_", " ")
    words = [word.capitalize() for word in name_part.split() if word]
    return " ".join(words) if words else "My Company"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# Token cache: maps token -> (expiry_timestamp, user_data_dict)
TOKEN_CACHE = {}
CACHE_TTL_SECONDS = 300 # Cache for 5 minutes

async def verify_supabase_token(token: str) -> Optional[dict]:
    import time
    now = time.time()
    
    # Check cache first to avoid rate limiting and connection overhead
    if token in TOKEN_CACHE:
        expiry, cached_user = TOKEN_CACHE[token]
        if now < expiry:
            return cached_user
        else:
            del TOKEN_CACHE[token]

    supabase_url = os.environ.get("SUPABASE_URL", "https://nqvkhcrzxdonmmtjzqup.supabase.co")
    supabase_url = supabase_url.rstrip("/")
    api_url = f"{supabase_url}/auth/v1/user"
    supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_TTolYCpD5R_nBnxx1Dt7yw_Mk42tl_4")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_key
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(api_url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                user_data = resp.json()
                # Cache successful token verification to prevent Supabase 429 / 403 blocks
                TOKEN_CACHE[token] = (now + CACHE_TTL_SECONDS, user_data)
                return user_data
    except Exception as e:
        logger.error(f"Supabase token verification request failed: {e}")
    return None


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try decoding local token first (backward compatibility for testing/local JWTs)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email", "local@example.com").lower().strip()
        if not is_work_email(email):
            raise HTTPException(status_code=400, detail="Personal email domains are not allowed. Please use your work email.")
        is_admin = (email == os.environ.get("ADMIN_EMAIL", "").lower().strip())
        return {
            "id": payload.get("sub", "local-id"),
            "email": email,
            "name": payload.get("name") or email.split("@")[0],
            "role": payload.get("role", "business"),
            "company": derive_business_name(email),
            "approved": True if is_admin else payload.get("approved", True)
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except HTTPException:
        raise
    except Exception:
        pass # Fallback to Supabase verification
        
    # Verify with Supabase
    supabase_user = await verify_supabase_token(token)
    if not supabase_user:
        raise HTTPException(status_code=401, detail="Invalid token or not authenticated")
        
    supabase_id = supabase_user.get("id") or supabase_user.get("sub")
    email = supabase_user.get("email", "").lower().strip()
    
    if not supabase_id or not email:
        raise HTTPException(status_code=401, detail="Invalid Supabase token data")
        
    if not is_work_email(email):
        raise HTTPException(status_code=400, detail="Personal email domains are not allowed. Please use your work email.")
        
    user_metadata = supabase_user.get("user_metadata", {})
    app_metadata = supabase_user.get("app_metadata", {})
    
    approved = app_metadata.get("approved") if "approved" in app_metadata else user_metadata.get("approved", True)
    
    # Override for admin email
    if email == os.environ.get("ADMIN_EMAIL", "").lower().strip():
        approved = True
        
    if not approved:
        raise HTTPException(
            status_code=403,
            detail="Your account is pending approval by an administrator."
        )
        
    return {
        "id": supabase_id,
        "email": email,
        "name": user_metadata.get("name") or email.split("@")[0],
        "role": app_metadata.get("role") or user_metadata.get("role") or "business",
        "company": derive_business_name(email),
        "approved": approved
    }


def user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        company=user["company"],
        approved=user.get("approved", True),
    )


# ---------------------------------------------------------------------------
# File parsing
# ---------------------------------------------------------------------------
def extract_text(filename: str, content: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "txt":
        return content.decode("utf-8", errors="ignore")
    if ext in ("doc", "docx"):
        doc = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    if ext == "pdf":
        reader = PdfReader(io.BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    raise HTTPException(status_code=400, detail="Unsupported file type. Use .txt, .docx or .pdf")


# ---------------------------------------------------------------------------
# LLM  (OpenAI official SDK, user-provided key)
# ---------------------------------------------------------------------------
INSIGHTS_SYSTEM = (
    "You are an expert B2B customer-insights analyst for Uplaud, a customer-led growth platform. "
    "You analyze sales/demo call transcripts and extract structured growth signals. "
    "Your single most important rule: any customer testimonial you produce must be a cohesive, first-person "
    "testimonial grounded strictly in what the customer actually said and felt — you may add light connective "
    "phrasing so it reads naturally, but you must never invent facts, numbers, features, or opinions the "
    "customer did not express. You always respond with a single valid JSON object and nothing else."
)


def build_insights_prompt(transcript: str, client_name: str, variation: int = 0, avoid: str = "") -> str:
    variation_note = ""
    if variation > 0:
        avoid_block = f"\nAlready-used testimonial text to AVOID repeating (pick DIFFERENT verbatim spans):\n\"\"\"{avoid}\"\"\"\n" if avoid else ""
        variation_note = (
            f"\n\n*** REGENERATION PASS #{variation}. *** Produce a MEANINGFULLY DIFFERENT result from any "
            f"previous version. For testimonial_fragments, deliberately choose DIFFERENT verbatim spans than "
            f"before. Re-synthesize every signal list from a fresh angle and surface additional or less-obvious "
            f"points you may have skipped before. Do NOT simply reword the previous selection.{avoid_block}"
        )
    return f"""Analyze the following client sales/demo call transcript thoroughly. The uploaded file is named after "{client_name}".

Be THOROUGH and specific. Genuinely mine the transcript — surface concrete details, numbers, timelines, names, workflows and the customer's ACTUAL sentiment (positive, mixed or negative). Do not be lazy or generic; short/empty lists make this useless.

Return ONLY a JSON object with EXACTLY these keys:
{{
  "company_name": "the customer/company name mentioned (not the seller). Fall back to a clean version of the file name if unknown",
  "speaker_name": "full name of the primary customer speaker (the buyer), if mentioned",
  "speaker_role": "the customer speaker's job title/role, if mentioned",
  "ae_name": "name of the seller / account executive, if mentioned",
  "sentiment_label": "one of: Positive, Neutral, Negative — the customer's genuine overall sentiment",
  "signal_score": 0,
  "call_type": "one of: Demo, Discovery, Onboarding, Support, Renewal",
  "summary": "3-4 sentences capturing the real arc of the conversation AND the genuine sentiment, including any hesitation or nuance",
  "motivations": ["what is driving the customer / why they're looking — 3-6 specific items when supported"],
  "pain_points": ["specific pains, frustrations, costs or problems they described — 3-6 items when supported, be concrete"],
  "buying_signals": ["statements/questions showing intent, urgency or fit — 3-6 items when supported"],
  "objections": ["concerns, risks, blockers or hesitations they raised — include even mild ones"],
  "customer_language": ["4-8 short VERBATIM quotes in the customer's own words that are quotable/telling (positive OR critical)"],
  "product_feedback": ["product feedback, feature requests, praise or criticism — 3-6 items when supported"],
  "faqs": ["explicit questions the customer asked"],
  "testimonial": "a polished, cohesive, FIRST-PERSON customer testimonial (3-6 flowing sentences) capturing what THIS customer actually said and their genuine sentiment"
}}

CRITICAL RULES for "testimonial" (the customer's testimonial, in their own voice):
- Write 3-6 sentences in the FIRST PERSON as the customer. It must read cohesively and naturally — like a real quote you'd feature on a website — NOT a list of disjointed fragments, and NEVER use " … " to stitch pieces together.
- Ground it strictly in what THIS customer actually said and felt. You MAY add light connective phrasing and a short lead-in or closing sentence for context so it flows well, but you must NOT invent facts, numbers, features, company names, or opinions the customer did not express.
- Convey the customer's GENUINE emotion and sentiment — enthusiastic if they were positive, honest and balanced if the experience was mixed or critical. Do not fake positivity, but make the feeling come through.
- Weave in their real, memorable phrases and word choices inside full, well-formed sentences.

Other rules:
- signal_score: integer 0-100 for overall opportunity strength (sentiment + intent + fit).
- customer_language items are verbatim customer quotes (no added quotation marks in the string).
- Every list item must be genuinely supported by the transcript. Keep each item to one concrete line.{variation_note}

Transcript:
\"\"\"
{transcript[:16000]}
\"\"\"
"""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


def _call_openai(system: str, user: str, temperature: float = 0.2) -> str:
    resp = openai_client.chat.completions.create(
        model=LLM_MODEL,
        response_format={"type": "json_object"},
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return resp.choices[0].message.content or ""


async def generate_insights(transcript: str, client_name: str, variation: int = 0, avoid: str = "") -> dict:
    if not openai_client:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured on the server.")
    temperature = 0.25 if variation == 0 else 0.7
    try:
        text = await asyncio.to_thread(
            _call_openai, INSIGHTS_SYSTEM, build_insights_prompt(transcript, client_name, variation, avoid), temperature
        )
    except Exception as e:  # noqa
        logger.error("OpenAI call failed: %s", e)
        raise HTTPException(status_code=502, detail="The language model request failed. Please try again.")
    try:
        return _parse_json(text)
    except Exception as e:
        logger.error("Failed to parse LLM JSON: %s | raw: %s", e, text[:500])
        raise HTTPException(status_code=502, detail="Could not parse insights from the model.")


# ---------------------------------------------------------------------------
# Website scraping — brand voice, brand color, logo extraction for the
# "Personalize workspace" flow (Sources page, state 0).
# ---------------------------------------------------------------------------
HEX_COLOR_RE = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")
GENERIC_HEX = {"#fff", "#ffffff", "#000", "#000000", "#fafafa", "#f5f5f5", "#eee", "#eeeeee", "#ccc", "#cccccc"}

BRAND_VOICE_SYSTEM = (
    "You are a brand strategist. Given a company's homepage title, meta description and visible "
    "site copy, infer their brand voice/tone in 2-3 concise sentences (e.g. playful vs formal, "
    "technical vs approachable, energetic vs calm). Ground it strictly in the text provided — never "
    "invent facts about the company. Respond with a single valid JSON object and nothing else."
)


def _extract_dominant_hex(html: str) -> Optional[str]:
    """Best-effort dominant brand color from inline <style> blocks / style attrs (excludes generic black/white/gray)."""
    codes = [c.lower() for c in HEX_COLOR_RE.findall(html)]
    codes = [c if len(c) == 7 else "#" + "".join(ch * 2 for ch in c[1:]) for c in codes]
    codes = [c for c in codes if c not in GENERIC_HEX]
    if not codes:
        return None
    return Counter(codes).most_common(1)[0][0]


async def scrape_business_website(website_domain: str) -> dict:
    """Scrape the given domain's homepage and derive brand_color, logo_url and (via LLM) brand_voice.
    Best-effort — returns whatever it can extract, never raises."""
    result = {"brand_color": "", "logo_url": "", "brand_voice": ""}
    url = f"https://{website_domain}"
    html = ""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (UplaudBrandBot)"})
            resp.raise_for_status()
            html = resp.text
            final_url = str(resp.url)
    except Exception as e:
        logger.warning("Website scrape failed for %s: %s", website_domain, e)
        return result

    try:
        soup = BeautifulSoup(html, "html.parser")
        title = (soup.title.string or "").strip() if soup.title and soup.title.string else ""
        meta_desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        meta_description = (meta_desc_tag.get("content") or "").strip() if meta_desc_tag else ""

        # Brand color: theme-color meta tag first, else dominant hex in inline CSS
        theme_color_tag = soup.find("meta", attrs={"name": "theme-color"})
        brand_color = (theme_color_tag.get("content") or "").strip() if theme_color_tag else ""
        if not brand_color or not HEX_COLOR_RE.fullmatch(brand_color):
            brand_color = _extract_dominant_hex(html) or ""
        result["brand_color"] = brand_color

        # Logo: og:image, then apple-touch-icon, then favicon link
        logo_url = ""
        og_image = soup.find("meta", attrs={"property": "og:image"})
        if og_image and og_image.get("content"):
            logo_url = og_image["content"]
        if not logo_url:
            icon_link = soup.find("link", attrs={"rel": lambda v: v and "apple-touch-icon" in v.lower()}) or \
                soup.find("link", attrs={"rel": lambda v: v and "icon" in v.lower()})
            if icon_link and icon_link.get("href"):
                logo_url = icon_link["href"]
        if logo_url:
            result["logo_url"] = urljoin(final_url, logo_url)

        # Brand voice: LLM inference grounded in scraped copy
        body_text = " ".join(soup.get_text(" ", strip=True).split())[:3000]
        if openai_client and (title or meta_description or body_text):
            prompt = (
                f"Homepage title: {title or 'N/A'}\n"
                f"Meta description: {meta_description or 'N/A'}\n"
                f"Visible site copy (truncated): {body_text or 'N/A'}\n\n"
                'Return ONLY a JSON object: {"brand_voice": "2-3 sentence description of this brand\'s tone/voice"}'
            )
            try:
                text = await asyncio.to_thread(_call_openai, BRAND_VOICE_SYSTEM, prompt, 0.3)
                result["brand_voice"] = (_parse_json(text) or {}).get("brand_voice", "").strip()
            except Exception as e:
                logger.warning("Brand voice LLM inference failed for %s: %s", website_domain, e)
    except Exception as e:
        logger.warning("Website scrape parsing failed for %s: %s", website_domain, e)

    return result


# ---------------------------------------------------------------------------
# Referral Agent — research a warm lead's public web presence, then draft a
# personalized email + LinkedIn InMail using the referrer's real testimonial.
# ---------------------------------------------------------------------------
RESEARCH_MODEL = os.environ.get("RESEARCH_MODEL", "gpt-4.1")

OUTREACH_SYSTEM = (
    "You are a senior referral/growth outreach specialist. You write warm, confident, non-salesy "
    "outreach to a warm lead who was personally referred by someone who recently experienced the "
    "referring company (usually via a product demo, not necessarily as a paying customer — never "
    "assume paying-customer status unless the testimonial explicitly says so). You always ground "
    "every claim strictly in the facts provided — you never invent job titles, company facts, "
    "names, news, or customer status. If personalization facts are thin, keep the message shorter "
    "and more general rather than fabricating detail. You respond with a single valid JSON object "
    "and nothing else."
)


def _call_openai_web_search(prompt: str) -> str:
    resp = openai_client.responses.create(
        model=RESEARCH_MODEL,
        tools=[{"type": "web_search"}],
        input=prompt,
    )
    return getattr(resp, "output_text", "") or ""


def _clean_research_line(line: str) -> str:
    line = re.sub(r"\[([^\]]+)\]\((?:https?://)?[^)]+\)", "", line)  # strip markdown links
    line = re.sub(r"\(\s*\)", "", line)  # leftover empty parens
    line = re.sub(r"\s{2,}", " ", line).strip()
    return line.lstrip("-•").strip()


async def research_lead(lead: dict) -> list:
    """Best-effort public web research on the lead and their company, returned as a list
    of clean, plain-text bullet strings. Never raises — falls back to [] so a research
    failure never blocks drafting."""
    if not openai_client:
        return []
    name = lead.get("name") or "this person"
    job_title = lead.get("job_title") or ""
    company = lead.get("company_name") or lead.get("receiver_company") or ""
    industry = lead.get("industry") or ""
    location = ", ".join([p for p in [lead.get("city"), lead.get("state"), lead.get("country")] if p])
    prompt = (
        f"Research the public professional web presence of {name}"
        f"{f', {job_title}' if job_title else ''}{f' at {company}' if company else ''}.\n"
        f"{f'Industry: {industry}. ' if industry else ''}{f'Location: {location}. ' if location else ''}\n"
        "Look for: recent public LinkedIn posts or professional activity (only if genuinely publicly "
        "indexed), the company's website/highlights, and any recent company news (funding, launches, press).\n"
        "Return 3-5 short, concrete bullet points of ONLY genuinely verifiable findings, one per line, each "
        "starting with '- '. Skip a bullet entirely rather than guessing or inventing. If you find nothing "
        "reliable, return a single line saying so. Write plain prose sentences only — no links, no markdown, "
        "no citation markers, no Sources section."
    )
    try:
        text = await asyncio.to_thread(_call_openai_web_search, prompt)
        lines = [_clean_research_line(l) for l in (text or "").split("\n") if l.strip()]
        return [l for l in lines if l]
    except Exception as e:  # noqa
        logger.warning("Lead web research failed: %s", e)
        return []


def _infer_preferred_channel(lead: dict, research_bullets: list) -> str:
    """Deterministically pick the outreach channel most likely to land: LinkedIn InMail
    when the lead has a LinkedIn profile AND the research surfaced genuinely recent
    activity/posts there, else email (falling back to LinkedIn if no email is known)."""
    has_linkedin = bool(lead.get("linkedin"))
    has_email = bool(lead.get("work_email"))
    activity = re.compile(r"(?i)\b(post(?:ed|s)?|shared|activity|wrote)\b")
    recency = re.compile(r"(?i)\b(day|days|week|weeks|month|months)\s+ago\b|\brecently\b")
    is_linkedin_active = has_linkedin and any(
        "linkedin" in b.lower() and activity.search(b) and recency.search(b) for b in research_bullets
    )
    if is_linkedin_active:
        return "Send LinkedIn InMail"
    if has_email:
        return "Send Email"
    return "Send LinkedIn InMail" if has_linkedin else "Send Email"


def build_outreach_prompt(
    lead: dict, referrer_testimonial: str, research_bullets: list, business_name: str, preferred_channel: str
) -> str:
    name = lead.get("name") or "there"
    job_title = lead.get("job_title") or ""
    company = lead.get("company_name") or lead.get("receiver_company") or ""
    referrer = lead.get("referrer_name") or "a mutual contact"
    who = name + (f" ({job_title}" + (f" at {company}" if company else "") + ")" if job_title or company else "")
    research_text = "\n".join(f"- {b}" for b in research_bullets) if research_bullets else "No reliable public findings available."

    is_strong_testimonial = bool(referrer_testimonial) and len(referrer_testimonial.strip()) >= 40

    return f"""A warm lead named {who} was just referred to {business_name} by {referrer}.

{referrer} recently experienced {business_name} — most likely through a product demo. Do NOT describe {referrer} as a "customer" or someone "using" the product unless their testimonial below explicitly says they already are; by default describe them as someone who "took a demo of {business_name}" or "recently saw {business_name} in action". {referrer} was impressed enough to specifically think {name} would find real value in {business_name} — that is the entire reason for this outreach, and the email must say so plainly and warmly (e.g. "{referrer} thought this could be genuinely useful for you").

IMPORTANT — {name} may not immediately remember who {referrer} is. Every draft (email and LinkedIn) MUST explicitly frame {referrer} as "your contact {referrer}" (or equivalent unambiguous phrasing like "your contact, {referrer}") the first time {referrer} is mentioned, so {name} instantly places them.

{referrer}'s actual testimonial (quote or closely paraphrase their real words in the email — do not invent anything beyond this):
\"\"\"{referrer_testimonial or "No testimonial text available."}\"\"\"

{"This testimonial is substantive and worth showcasing directly — the email body MUST include a short, genuine excerpt of it wrapped in actual quotation marks, in " + referrer + "'s own words (verbatim or a very close, faithful paraphrase), not just a loose summary folded into your own sentence." if is_strong_testimonial else "This testimonial is thin or unavailable — keep any reference to it brief and general rather than inventing a quote."}

Public web research findings about {name} / {company} (use ONLY these for personalization; if none are reliable, keep the email shorter and more general rather than inventing anything):
{research_text}

The system has already determined the single best outreach channel for this lead is: {preferred_channel}. Your next_action_cta MUST be exactly "{preferred_channel}", and next_action_label must reflect that channel choice.

Write a first-touch outreach package with a genuinely compelling hook — this must earn a demo booking, not just "explore synergies." Return ONLY a JSON object with exactly these keys:
{{
  "research_headline": "one punchy sentence (under 100 characters) capturing the single most compelling, concrete, REAL finding from the research above — no links, no markdown, no fluff. If nothing concrete was found, summarize what IS genuinely known about {name}/{company} in one sentence instead.",
  "email_subject": "short, specific, non-clickbait email subject line",
  "email_body": "a warm, confident, concise email (5-8 sentences) that: (1) opens by naming {referrer} explicitly as 'your contact {referrer}' and explaining, in your own words, that {referrer} recently experienced {business_name} (via demo unless the testimonial says otherwise) and specifically thought of {name}, (2) {"includes a short direct quote from " + referrer + "'s real testimonial in quotation marks" if is_strong_testimonial else "briefly references " + referrer + "'s experience"}, (3) includes ONE genuine, specific personalization drawn from the research findings to build a strong hook — omit this if no real findings exist, (4) makes a clear, confident case for why a demo is worth their time, (5) ends with a direct call-to-action to book a demo (not a vague 'quick call'). Sign off as 'The {business_name} team'.",
  "linkedin_message": "a shorter, casual LinkedIn InMail version (2-4 sentences, under 500 characters) that still opens by naming {referrer} as 'your contact {referrer}', with the same grounding rules and the same demo-booking CTA.",
  "next_action_label": "a short imperative sentence describing the single best next action for a sales rep to take on this lead, referencing a real, specific detail when available and matching the {preferred_channel} channel",
  "next_action_cta": "{preferred_channel}"
}}
Every sentence must be grounded in the facts given above. Never invent a job title, company fact, product, quote, or customer status that isn't in the provided testimonial or research findings."""


async def draft_outreach(lead: dict, referrer_testimonial: str, research_bullets: list, business_name: str, preferred_channel: str) -> dict:
    if not openai_client:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured on the server.")
    try:
        text = await asyncio.to_thread(
            _call_openai,
            OUTREACH_SYSTEM,
            build_outreach_prompt(lead, referrer_testimonial, research_bullets, business_name, preferred_channel),
            0.4,
        )
    except Exception as e:  # noqa
        logger.error("Outreach draft call failed: %s", e)
        raise HTTPException(status_code=502, detail="The language model request failed. Please try again.")
    try:
        return _parse_json(text)
    except Exception as e:
        logger.error("Failed to parse outreach JSON: %s | raw: %s", e, text[:500])
        raise HTTPException(status_code=502, detail="Could not parse the drafted outreach.")


# ---------------------------------------------------------------------------
# Verbatim testimonial builder
# ---------------------------------------------------------------------------
def _norm(s: str) -> str:
    """Normalize for verbatim substring matching: lowercase, unify quotes, collapse whitespace."""
    s = s or ""
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()


def _clean_fragment(f: str) -> str:
    return (f or "").strip().strip('"').strip("'").strip("\u201c\u201d\u2018\u2019").strip()


def build_verbatim_testimonial(fragments, transcript: str, customer_language) -> str:
    """Stitch together ONLY spans that appear verbatim in the transcript.

    Guarantees the returned testimonial is composed exclusively of the customer's
    actual words. Fragments that are not exact substrings of the transcript are
    discarded. If none survive, falls back to the single best verbatim quote from
    customer_language (edge case: return the best short verbatim quote available).
    """
    norm_t = _norm(transcript)
    kept, seen = [], set()

    for f in (fragments or []):
        if not isinstance(f, str):
            continue
        clean = _clean_fragment(f)
        fn = _norm(clean)
        if len(fn) < 12:  # too short to be a meaningful span
            continue
        if fn in norm_t:  # verbatim guarantee
            if fn not in seen:
                seen.add(fn)
                kept.append(clean)

    if not kept:
        # Fallback (edge case a): best available verbatim quote from customer_language
        verbatim_quotes = [q for q in (customer_language or []) if isinstance(q, str) and _norm(_clean_fragment(q)) in norm_t]
        pool = verbatim_quotes if verbatim_quotes else [q for q in (customer_language or []) if isinstance(q, str)]
        pool = sorted(pool, key=lambda q: len(q or ""), reverse=True)
        if pool:
            kept = [_clean_fragment(pool[0])]

    joined = " \u2026 ".join([k for k in kept if k]).strip()
    if joined:
        joined = joined[0].upper() + joined[1:]
        if joined[-1] not in ".!?\u2026\"'":
            joined += "."
    return joined


# ---------------------------------------------------------------------------
# Routes: auth
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Uplaud Growth Engine API"}


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    password = body.password
    
    # Check for work email
    if not is_work_email(email):
        raise HTTPException(status_code=400, detail="Personal email domains (like gmail.com) are not allowed. Please use your work email.")
    
    # Authenticate with Supabase directly over API
    supabase_url = os.environ.get("SUPABASE_URL", "https://nqvkhcrzxdonmmtjzqup.supabase.co")
    supabase_url = supabase_url.rstrip("/")
    api_url = f"{supabase_url}/auth/v1/token?grant_type=password"
    supabase_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_TTolYCpD5R_nBnxx1Dt7yw_Mk42tl_4")
    
    headers = {
        "apikey": supabase_key,
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(api_url, headers=headers, json=payload, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            resp_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Supabase login request failed: {e}")
        raise HTTPException(status_code=502, detail="Connection to authentication server failed")
        
    user_data = resp_data.get("user", {})
    user_metadata = user_data.get("user_metadata", {})
    app_metadata = user_data.get("app_metadata", {})
    
    approved = app_metadata.get("approved") if "approved" in app_metadata else user_metadata.get("approved", True)
    
    # Admin is always approved
    if email == os.environ.get("ADMIN_EMAIL", "").lower().strip():
        approved = True
        
    if not approved:
        raise HTTPException(status_code=403, detail="Your account is pending approval by an administrator.")
        
    user_out = UserOut(
        id=user_data["id"],
        email=email,
        name=user_metadata.get("name") or email.split("@")[0],
        role=app_metadata.get("role") or user_metadata.get("role") or "business",
        company=derive_business_name(email),
        approved=approved
    )
    
    return LoginResponse(
        token=resp_data["access_token"],
        user=user_out
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return user_to_out(current)


@api_router.post("/business/profile")
async def save_business_profile(body: BusinessProfileRequest, current=Depends(get_current_user)):
    website = body.website.strip().lower()
    # Remove protocol prefix if present
    clean_website = re.sub(r"^https?://", "", website).rstrip("/")
    if clean_website.startswith("www."):
        clean_website = clean_website[4:]
    
    # Derive business name
    company_name = derive_business_name("user@" + clean_website) if clean_website else current.get("company", "My Company")

    # Scrape the website for brand voice, brand color and logo
    brand = await scrape_business_website(clean_website) if clean_website else {"brand_color": "", "logo_url": "", "brand_voice": ""}
    brand_color = brand.get("brand_color") or "#6d46c6"
    
    profile = {
        "website": clean_website,
        "company_name": company_name,
        "brand_color": brand_color,
        "logo_url": brand.get("logo_url") or "",
        "brand_voice": brand.get("brand_voice") or "",
    }
    
    # Save/upsert directly to Airtable "Business" table (No MongoDB!)
    if airtable_client._enabled():
        try:
            formula = f'LOWER({{Business Domain}})="{airtable_client._escape(clean_website)}"'
            existing = await airtable_client._get(airtable_client.TABLE_BUSINESS, {"filterByFormula": formula, "pageSize": 1})
            recs = existing.get("records", [])
            fields = {
                "Business Name": company_name,
                "Business Domain": clean_website,
                "Brand_Color": brand_color,
            }
            if profile["logo_url"]:
                fields["Logo_Url"] = profile["logo_url"]
            if profile["brand_voice"]:
                fields["Brand_Voice"] = profile["brand_voice"]
            if recs:
                await airtable_client._update(airtable_client.TABLE_BUSINESS, recs[0]["id"], fields)
            else:
                await airtable_client._create(airtable_client.TABLE_BUSINESS, fields)
        except Exception as ae:
            logger.warning(f"Failed to save business profile to Airtable Business table: {ae}")
            raise HTTPException(status_code=502, detail="Failed to save profile to Airtable")
            
    return {"status": "ok", "profile": profile}


@api_router.get("/business/profile")
async def get_business_profile(current=Depends(get_current_user)):
    # Retrieve profile purely from Airtable (No MongoDB!)
    email = current.get("email", "").lower().strip()
    domain = email.split("@")[-1].lower() if "@" in email else ""
    
    company_name = current.get("company", "My Company")
    website = domain
    brand_color = "#6d46c6"
    logo_url = ""
    brand_voice = ""
    
    if airtable_client._enabled() and domain:
        try:
            formula = f'LOWER({{Business Domain}})="{airtable_client._escape(domain)}"'
            existing = await airtable_client._get(airtable_client.TABLE_BUSINESS, {"filterByFormula": formula, "pageSize": 1})
            recs = existing.get("records", [])
            if recs:
                fields = recs[0].get("fields", {})
                company_name = fields.get("Business Name") or company_name
                website = fields.get("Business Domain") or domain
                brand_color = fields.get("Brand_Color") or brand_color
                logo_url = fields.get("Logo_Url") or ""
                brand_voice = fields.get("Brand_Voice") or ""
        except Exception as ae:
            logger.warning(f"Failed to fetch business profile from Airtable: {ae}")
            
    return {
        "website": website,
        "company_name": company_name,
        "brand_color": brand_color,
        "logo_url": logo_url,
        "brand_voice": brand_voice,
    }


# ---------------------------------------------------------------------------
# Routes: sources (Purely Airtable-driven, No MongoDB!)
# ---------------------------------------------------------------------------
async def _current_business_name(current: dict) -> str:
    try:
        business_name = await airtable_client.get_source_business_name_by_email_domain(
            current["email"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    return business_name or current["company"]


def _record_source_status(fields: dict) -> str:
    explicit_status = (fields.get("Source_Status") or "").strip().lower()
    if explicit_status in {"uploaded", "analyzed"}:
        return explicit_status
    legacy_analysis_fields = (
        "Person",
        "Company",
        "Signal_Score",
        "Testimonial_Draft",
        "Customer_Language",
    )
    if any(fields.get(field) not in (None, "") for field in legacy_analysis_fields):
        return "analyzed"
    return "uploaded"


def _testimonial_status(fields: dict) -> str:
    persisted_status = (fields.get("Testimonial_Status") or "draft").strip().lower()
    if persisted_status == "draft" and fields.get("Approval_Requested_At"):
        return "sent"
    return persisted_status


def _source_lifecycle_state(fields: dict) -> str:
    source_status = _record_source_status(fields)
    testimonial_status = _testimonial_status(fields)
    if source_status == "uploaded" and testimonial_status == "draft":
        return "uploaded"
    if source_status == "analyzed" and testimonial_status in {
        "draft",
        "sent",
        "approved",
    }:
        return "analyzed" if testimonial_status == "draft" else testimonial_status
    return "invalid"


def _display_testimonial(fields: dict) -> str:
    """Use the immutable approval snapshot whenever the source is approved."""
    if _testimonial_status(fields) == "approved":
        return (
            fields.get("Approved_Testimonial")
            or fields.get("Testimonial_Draft")
            or ""
        )
    return fields.get("Testimonial_Draft") or ""


def _record_client_name(fields: dict) -> str:
    if fields.get("Company") or fields.get("Person"):
        return fields.get("Company") or fields.get("Person")
    filename = fields.get("Filename") or fields.get("Name") or "Customer"
    stem = filename.rsplit(".", 1)[0]
    return stem.replace("_", " ").replace("-", " ").title()


def record_to_source_out(rec: dict) -> SourceOut:
    f = rec.get("fields", {})
    status = _record_source_status(f)
    motivations = f.get("Motivations", "").split("\n") if f.get("Motivations") else []
    pain_points = f.get("Pain_Points", "").split("\n") if f.get("Pain_Points") else []
    buying_signals = f.get("Buying_Signals", "").split("\n") if f.get("Buying_Signals") else []
    objections = f.get("Objections", "").split("\n") if f.get("Objections") else []
    customer_language = f.get("Customer_Language", "").split("\n") if f.get("Customer_Language") else []
    product_feedback = f.get("Product_Feedback", "").split("\n") if f.get("Product_Feedback") else []
    faqs = f.get("FAQs", "").split("\n") if f.get("FAQs") else []
    
    insights = None
    if status == "analyzed":
        insights = {
            "company_name": f.get("Company", ""),
            "speaker_name": f.get("Person", ""),
            "speaker_role": f.get("Role", ""),
            "ae_name": f.get("AE_Name", ""),
            "sentiment_label": f.get("Sentiment") or "Positive",
            "signal_score": int(f.get("Signal_Score") or 0),
            "call_type": f.get("Call_Type") or "Demo",
            "summary": f.get("Summary", ""),
            "motivations": [m for m in motivations if m],
            "pain_points": [p for p in pain_points if p],
            "buying_signals": [b for b in buying_signals if b],
            "objections": [o for o in objections if o],
            "customer_language": [c for c in customer_language if c],
            "product_feedback": [pf for pf in product_feedback if pf],
            "faqs": [faq for faq in faqs if faq],
        }

    testimonial_draft = _display_testimonial(f) or None
    if status == "analyzed" and not testimonial_draft and customer_language:
        testimonial_draft = " ".join(customer_language[:3]).strip()
    filename = f.get("Filename") or f.get("Name") or "Transcript.txt"
    transcript = f.get("Transcript_Text") or ""
    word_count = int(f.get("Word_Count") or len(transcript.split()))
        
    return SourceOut(
        id=f.get("Source_Id") or rec.get("id"),
        filename=filename,
        file_type=f.get("File_Type") or filename.rsplit(".", 1)[-1].lower(),
        client_name=_record_client_name(f),
        conversation_code="CV_001",
        source_name="Upload",
        duration_min=max(1, round(word_count / 140)) if word_count else 0,
        word_count=word_count,
        status=status,
        created_at=f.get("Created_At") or rec.get("createdTime", ""),
        insights=insights,
        testimonial_draft=testimonial_draft,
        testimonial_is_verbatim=True,
        share_id=f.get("Share_Id") or "",
        testimonial_status=_testimonial_status(f),
        approved_at=f.get("Approved_At") or None,
        approval_requested_at=f.get("Approval_Requested_At") or None,
    )


def _growth_signal_record_to_doc(rec: dict) -> dict:
    f = rec.get("fields", {})
    doc = record_to_source_out(rec).model_dump()
    doc.update(
        {
            "brand": f.get("Business_Name") or "PayRewards",
            "owner": f.get("Owner_Id") or "",
            "transcript": f.get("Transcript_Text") or "",
            "client_email": f.get("Client_Email") or "",
            "airtable_record_id": rec.get("id") or "",
        }
    )
    return doc


def _legacy_source_share_id(source_id: str, business_name: str) -> str:
    """Derive a stable high-entropy token without exposing its Airtable record ID."""
    identity = f"uplaud-source:{business_name}:{source_id}"
    digest = hmac.new(
        JWT_SECRET.encode("utf-8"), identity.encode("utf-8"), hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


async def _unique_source_share_id(
    *,
    preferred: str = "",
    source_id: str = "",
    business_name: str = "",
) -> str:
    """Allocate a globally unique capability token through strict Airtable reads."""
    for attempt in range(MAX_SHARE_TOKEN_ATTEMPTS):
        candidate = preferred if attempt == 0 and preferred else secrets.token_urlsafe(32)
        try:
            existing = await airtable_client.get_growth_signal_by_share_id(candidate)
        except AirtableSourceCollisionError:
            continue
        if not existing:
            return candidate
        fields = existing.get("fields", {})
        if (
            source_id
            and fields.get("Source_Id") == source_id
            and fields.get("Business_Name") == business_name
        ):
            return candidate
    raise AirtableSourceCollisionError("Could not allocate a unique source Share_Id")


async def _verify_persisted_source_share_id(
    rec: dict, *, business_name: str, owner_id: str
) -> dict:
    """Post-verify a persisted token and repair a collision on this source row."""
    current = rec
    for _ in range(MAX_SHARE_TOKEN_ATTEMPTS):
        fields = current.get("fields", {})
        share_id = fields.get("Share_Id") or ""
        try:
            matched = await airtable_client.get_growth_signal_by_share_id(share_id)
        except AirtableSourceCollisionError:
            matched = None
        if matched and matched.get("id") == current.get("id"):
            return current
        replacement = await _unique_source_share_id(
            source_id=fields.get("Source_Id") or "",
            business_name=business_name,
        )
        current = await airtable_client.update_source_by_id(
            fields.get("Source_Id") or "",
            business_name,
            {"Share_Id": replacement},
            owner_id=owner_id,
        )
        if not current:
            raise AirtableSourceLookupError("Persisted source disappeared")
    raise AirtableSourceCollisionError("Could not verify a unique source Share_Id")


@api_router.post("/sources", response_model=SourceOut)
async def upload_source(file: UploadFile = File(...), current=Depends(get_current_user)):
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large. Maximum size is {MAX_UPLOAD_BYTES} bytes.",
        )
    filename = file.filename or "Transcript.txt"
    text = extract_text(filename, content)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
    if len(text) > MAX_AIRTABLE_TRANSCRIPT_CHARS:
        raise HTTPException(
            status_code=413,
            detail=(
                "Transcript is too large to store safely. "
                f"Maximum size is {MAX_AIRTABLE_TRANSCRIPT_CHARS:,} characters."
            ),
        )
    word_count = len(text.split())
    business_name = await _current_business_name(current)
    source_id = str(uuid.uuid4())
    try:
        share_id = await _unique_source_share_id(
            source_id=source_id, business_name=business_name
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    try:
        blob_url = await blob_storage.store_source(
            source_id,
            filename,
            content,
            file.content_type or "application/octet-stream",
        )
    except blob_storage.BlobStorageUnavailable:
        raise HTTPException(
            status_code=503, detail="File storage is temporarily unavailable."
        ) from None
    except blob_storage.BlobStorageError:
        raise HTTPException(
            status_code=502, detail="Could not persist the uploaded file."
        ) from None
    try:
        rec = await airtable_client.create_uploaded_source(
            source_id=source_id,
            business_name=business_name,
            owner_id=current["id"],
            filename=filename,
            file_type=filename.rsplit(".", 1)[-1].lower(),
            transcript_text=text,
            word_count=word_count,
            share_id=share_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            blob_url=blob_url,
        )
    except Exception as exc:
        logger.warning("Source upload persistence failed: %s", exc)
        await blob_storage.delete_blob(blob_url)
        raise HTTPException(
            status_code=502, detail="Could not persist the uploaded source."
        ) from None
    try:
        rec = await _verify_persisted_source_share_id(
            rec, business_name=business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    return record_to_source_out(rec)


@api_router.get("/sources", response_model=List[SourceOut])
async def list_sources(current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        records = await airtable_client.list_growth_signals_by_business(
            business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    return [record_to_source_out(rec) for rec in records]


@api_router.get("/sources/{source_id}", response_model=SourceOut)
async def get_source(source_id: str, current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        rec = await airtable_client.get_source_by_id(
            source_id, business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if rec:
        return record_to_source_out(rec)
    raise HTTPException(status_code=404, detail="Source not found")


@api_router.post("/sources/{source_id}/analyze", response_model=SourceOut)
async def analyze_source(source_id: str, request: Request, regenerate: bool = False, current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        rec = await airtable_client.get_source_by_id(
            source_id, business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if not rec:
        raise HTTPException(status_code=404, detail="Source not found")
    fields = rec.get("fields", {})
    if not fields.get("Share_Id"):
        try:
            share_id = await _unique_source_share_id(
                preferred=_legacy_source_share_id(source_id, business_name),
                source_id=source_id,
                business_name=business_name,
            )
            rec = await airtable_client.update_source_by_id(
                source_id,
                business_name,
                {"Share_Id": share_id},
                owner_id=current["id"],
            )
        except AirtableSourceLookupError:
            raise HTTPException(
                status_code=503,
                detail="Source storage is temporarily unavailable.",
            ) from None
        except Exception as exc:
            logger.warning("Legacy source Share_Id persistence failed: %s", exc)
            raise HTTPException(
                status_code=502, detail="Could not persist the source share link."
            ) from None
        if not rec:
            raise HTTPException(status_code=404, detail="Source not found")
        try:
            rec = await _verify_persisted_source_share_id(
                rec, business_name=business_name, owner_id=current["id"]
            )
        except RuntimeError:
            raise HTTPException(
                status_code=503,
                detail="Source storage is temporarily unavailable.",
            ) from None
        fields = rec.get("fields", {})
    lifecycle_state = _source_lifecycle_state(fields)
    if lifecycle_state == "invalid":
        raise HTTPException(status_code=409, detail="Source lifecycle state is invalid.")
    if regenerate and lifecycle_state in {"sent", "approved"}:
        raise HTTPException(
            status_code=409,
            detail="This testimonial can no longer be regenerated.",
        )
    if lifecycle_state in {"analyzed", "sent", "approved"} and not regenerate:
        return record_to_source_out(rec)

    transcript_text = (fields.get("Transcript_Text") or "").strip()
    if not transcript_text:
        raise HTTPException(
            status_code=409,
            detail="This source has no persisted transcript and cannot be regenerated.",
        )
    avoid = (fields.get("Testimonial_Draft") or "") if regenerate else ""
    try:
        result = await generate_insights(
            transcript_text,
            _record_client_name(fields),
            variation=1 if regenerate else 0,
            avoid=avoid,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=502, detail="The language model request failed. Please try again."
        ) from None
    crafted = (result.pop("testimonial", "") or "").strip()
    clean_result = {}
    for k, v in result.items():
        if k in Insights.model_fields:
            field_type = Insights.model_fields[k].annotation
            if v is None and (field_type is str or str(field_type) == "<class 'str'>"):
                clean_result[k] = ""
            else:
                clean_result[k] = v
    insights = Insights(**clean_result)
    testimonial = crafted or (
        " ".join(insights.customer_language[:3]).strip() if insights.customer_language else insights.summary
    )
    insight_values = insights.model_dump()
    share_id = fields["Share_Id"]
    analysis_fields = {
        "Person": insight_values["speaker_name"],
        "Role": insight_values["speaker_role"],
        "AE_Name": insight_values["ae_name"],
        "Company": insight_values["company_name"],
        "Sentiment": insight_values["sentiment_label"],
        "Signal_Score": insight_values["signal_score"],
        "Call_Type": insight_values["call_type"],
        "Summary": insight_values["summary"],
        "Motivations": "\n".join(insight_values["motivations"]),
        "Pain_Points": "\n".join(insight_values["pain_points"]),
        "Buying_Signals": "\n".join(insight_values["buying_signals"]),
        "Objections": "\n".join(insight_values["objections"]),
        "Customer_Language": "\n".join(insight_values["customer_language"]),
        "Product_Feedback": "\n".join(insight_values["product_feedback"]),
        "FAQs": "\n".join(insight_values["faqs"]),
        "Testimonial_Draft": testimonial,
        "Share_Id": share_id,
        "Source_Status": "analyzed",
    }
    try:
        updated_rec = await airtable_client.update_source_by_id(
            source_id,
            business_name,
            analysis_fields,
            owner_id=current["id"],
        )
    except AirtableSourceConflictError:
        raise HTTPException(
            status_code=409, detail="Source lifecycle changed; reload and try again."
        ) from None
    except AirtableSourceLookupError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    except Exception as exc:
        logger.warning("Source analysis persistence failed: %s", exc)
        raise HTTPException(
            status_code=502, detail="Could not persist the source analysis."
        ) from None
    if not updated_rec:
        raise HTTPException(status_code=404, detail="Source not found")

    return record_to_source_out(updated_rec)


@api_router.put("/sources/{source_id}/testimonial", response_model=SourceOut)
async def update_testimonial(source_id: str, body: TestimonialUpdate, current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        existing = await airtable_client.get_source_by_id(
            source_id, business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if not existing:
        raise HTTPException(status_code=404, detail="Source not found")
    existing_fields = existing.get("fields", {})
    lifecycle_state = _source_lifecycle_state(existing_fields)
    if lifecycle_state == "approved":
        raise HTTPException(
            status_code=409, detail="Approved testimonial content is immutable."
        )
    if lifecycle_state not in {"analyzed", "sent"}:
        raise HTTPException(
            status_code=409, detail="Analyze this source before editing its testimonial."
        )
    try:
        updated = await airtable_client.update_source_by_id(
            source_id,
            business_name,
            {"Testimonial_Draft": body.testimonial_draft},
            owner_id=current["id"],
        )
    except AirtableSourceConflictError:
        raise HTTPException(
            status_code=409, detail="Source lifecycle changed; reload and try again."
        ) from None
    except AirtableSourceLookupError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    except Exception as exc:
        logger.warning("Failed to update source testimonial: %s", exc)
        raise HTTPException(status_code=502, detail="Could not update testimonial.") from None
    if not updated:
        raise HTTPException(status_code=404, detail="Source not found")
    return record_to_source_out(updated)


@api_router.get("/sources/{source_id}/email-draft", response_model=EmailDraft)
async def email_draft(source_id: str, current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        rec = await airtable_client.get_source_by_id(
            source_id, business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if not rec:
        raise HTTPException(status_code=404, detail="Source not found")
    doc = _growth_signal_record_to_doc(rec)
    client_name = doc["client_name"]
    ins = doc.get("insights") or {}
    company = ins.get("company_name") or client_name
    testimonial = doc.get("testimonial_draft") or ""
    speaker = ins.get("speaker_name") or ""
    first = speaker.split(" ")[0] if speaker else company.split(" ")[0]
    subject = f"A quick thank you, {first} — and one small favor"
    body = (
        f"Hi {first},\n\n"
        f"Thank you again for the great conversation — it was fantastic to hear how things are going on your side. "
        f"A few of the things you shared really stood out to us:\n\n"
        f"\u201c{testimonial}\u201d\n\n"
        f"With your permission, we'd love to share this as a short testimonial. "
        f"I've attached a summary of our conversation for your reference. "
        f"Feel free to tweak the wording so it feels right to you — just reply to this email with your go-ahead.\n\n"
        f"Warm regards,\n{current['name']}\n{current['company']}"
    )
    return EmailDraft(
        to=doc.get("client_email") or "customer@example.com",
        subject=subject,
        body=body,
        attachment_name=f"{client_name} - Conversation Summary.pdf",
    )


def _growth_signal_record_to_pub_doc(rec: dict) -> dict:
    """Adapt a raw Airtable Growth_Signals record for public testimonial routes."""
    f = rec.get("fields", {})
    insights = {
        "company_name": f.get("Company", ""),
        "speaker_name": f.get("Person", ""),
        "speaker_role": f.get("Role", ""),
        "sentiment_label": f.get("Sentiment") or "Positive",
        "signal_score": int(f.get("Signal_Score") or 0),
        "call_type": f.get("Call_Type") or "Demo",
    }
    return {
        "id": f.get("Source_Id") or rec.get("id"),
        "share_id": f.get("Share_Id") or "",
        "brand": f.get("Business_Name") or "PayRewards",
        "client_name": _record_client_name(f),
        "client_email": f.get("Client_Email") or "",
        "insights": insights,
        "testimonial_draft": _display_testimonial(f),
        "testimonial_status": _testimonial_status(f),
        "lifecycle_state": _source_lifecycle_state(f),
        "approved_snapshot_missing": (
            _testimonial_status(f) == "approved"
            and not bool(f.get("Approved_Testimonial"))
        ),
        "approved_at": f.get("Approved_At") or None,
    }


async def find_public_source(share_id: str) -> Optional[dict]:
    """Locate a source by its persisted public Share_Id."""
    try:
        rec = await airtable_client.get_growth_signal_by_share_id(share_id)
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if rec:
        return _growth_signal_record_to_pub_doc(rec)
    return None


def _public_payload(doc: dict) -> PublicTestimonial:
    ins = doc.get("insights") or {}
    return PublicTestimonial(
        share_id=doc["share_id"],
        company_name=ins.get("company_name") or doc.get("client_name", ""),
        brand=doc.get("brand") or "PayRewards",
        speaker_name=ins.get("speaker_name") or "",
        speaker_role=ins.get("speaker_role") or "",
        testimonial=doc.get("testimonial_draft") or "",
        status=doc.get("testimonial_status") or "draft",
        approved_at=doc.get("approved_at"),
    )


def _approval_fingerprint(doc: dict) -> tuple:
    return (
        doc.get("testimonial_status"),
        doc.get("testimonial_draft"),
        doc.get("approved_at"),
    )


async def _sync_canonical_approval_to_uplaud(
    share_id: str, request: Request
) -> dict:
    """Reconcile Uplaud from the latest approved source, including race retries."""
    canonical = await find_public_source(share_id)
    for _ in range(3):
        if not canonical:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        if canonical.get("lifecycle_state") != "approved":
            raise HTTPException(
                status_code=409, detail="Testimonial approval did not persist."
            )
        testimonial = (canonical.get("testimonial_draft") or "").strip()
        approved_at = canonical.get("approved_at")
        if not testimonial or not approved_at:
            raise HTTPException(
                status_code=409, detail="Approved testimonial is incomplete."
            )
        business_name = canonical.get("brand") or "PayRewards"
        ins = canonical.get("insights") or {}
        speaker_name = ins.get("speaker_name") or canonical.get("client_name", "")
        try:
            reviewer_id = await airtable_client.find_or_create_user(
                name=speaker_name, email=canonical.get("client_email") or None
            )
            share_link = f"{str(request.base_url).rstrip('/')}/t/{share_id}"
            await airtable_client.upsert_uplaud_record(
                business_name=business_name,
                testimonial=testimonial,
                reviewer_record_id=reviewer_id,
                share_id=share_id,
                share_link=share_link,
                date_added=approved_at[:10],
            )
        except Exception as exc:
            logger.warning("Approved testimonial sync failed: %s", exc)
            raise HTTPException(
                status_code=502, detail="Could not approve testimonial."
            ) from None
        latest = await find_public_source(share_id)
        if latest and _approval_fingerprint(latest) == _approval_fingerprint(canonical):
            return latest
        canonical = latest
    raise HTTPException(
        status_code=503, detail="Testimonial approval is changing; please retry."
    )


@api_router.get("/public/testimonial/{share_id}", response_model=PublicTestimonial)
async def public_get_testimonial(share_id: str):
    doc = await find_public_source(share_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return _public_payload(doc)


@api_router.put("/public/testimonial/{share_id}", response_model=PublicTestimonial)
async def public_update_testimonial(share_id: str, body: PublicUpdate):
    doc = await find_public_source(share_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    if doc.get("lifecycle_state") != "sent":
        raise HTTPException(
            status_code=409,
            detail="Only a testimonial awaiting approval can be edited.",
        )
    try:
        updated = await airtable_client.update_source_by_share_id(
            share_id,
            {"Testimonial_Draft": body.testimonial_draft},
        )
    except AirtableSourceConflictError:
        raise HTTPException(
            status_code=409, detail="Approved testimonial content is immutable."
        ) from None
    except AirtableSourceLookupError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    except Exception as exc:
        logger.warning("Public testimonial update failed: %s", exc)
        raise HTTPException(status_code=502, detail="Could not update testimonial.") from None
    if not updated:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return _public_payload(_growth_signal_record_to_pub_doc(updated))


@api_router.post("/public/testimonial/{share_id}/approve", response_model=PublicTestimonial)
async def public_approve_testimonial(share_id: str, request: Request):
    doc = await find_public_source(share_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    status = doc.get("lifecycle_state") or "invalid"
    if status not in {"sent", "approved"}:
        raise HTTPException(
            status_code=409, detail="This testimonial is not awaiting approval."
        )
    testimonial = (doc.get("testimonial_draft") or "").strip()
    if not testimonial:
        raise HTTPException(
            status_code=409, detail="A nonempty testimonial is required for approval."
        )

    candidate_approved_at = (
        doc.get("approved_at") or datetime.now(timezone.utc).isoformat()
    )
    try:
        receipt = await blob_storage.get_or_create_approval_receipt(
            share_id=share_id,
            source_id=doc.get("id") or "",
            testimonial=testimonial,
            approved_at=candidate_approved_at,
        )
    except blob_storage.InvalidApprovalReceipt:
        raise HTTPException(
            status_code=409, detail="Approval receipt validation failed."
        ) from None
    except blob_storage.BlobStorageUnavailable:
        raise HTTPException(
            status_code=503, detail="Approval storage is temporarily unavailable."
        ) from None
    except blob_storage.BlobStorageError:
        raise HTTPException(
            status_code=502, detail="Could not persist testimonial approval."
        ) from None

    receipt_testimonial = receipt["testimonial"]
    receipt_approved_at = receipt["approved_at"]
    already_reconciled = (
        status == "approved"
        and testimonial == receipt_testimonial
        and doc.get("approved_at") == receipt_approved_at
        and not doc.get("approved_snapshot_missing")
    )
    approved_doc = doc
    if not already_reconciled:
        try:
            updated = await airtable_client.update_source_by_share_id(
                share_id,
                {
                    "Testimonial_Status": "approved",
                    "Approved_Testimonial": receipt_testimonial,
                    "Approved_At": receipt_approved_at,
                },
            )
        except AirtableSourceConflictError:
            raise HTTPException(
                status_code=409,
                detail="Source approval does not match its immutable receipt.",
            ) from None
        except AirtableSourceLookupError:
            raise HTTPException(
                status_code=503,
                detail="Source storage is temporarily unavailable.",
            ) from None
        except Exception as exc:
            logger.warning("Public testimonial approval failed: %s", exc)
            raise HTTPException(
                status_code=502, detail="Could not approve testimonial."
            ) from None
        if not updated:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        approved_doc = _growth_signal_record_to_pub_doc(updated)

    if (
        approved_doc.get("lifecycle_state") != "approved"
        or approved_doc.get("testimonial_draft") != receipt_testimonial
        or approved_doc.get("approved_at") != receipt_approved_at
    ):
        raise HTTPException(
            status_code=409,
            detail="Source approval does not match its immutable receipt.",
        )

    reconciled_doc = await _sync_canonical_approval_to_uplaud(share_id, request)
    if (
        reconciled_doc.get("testimonial_draft") != receipt_testimonial
        or reconciled_doc.get("approved_at") != receipt_approved_at
    ):
        raise HTTPException(
            status_code=409,
            detail="Source approval does not match its immutable receipt.",
        )
    return _public_payload(reconciled_doc)


@api_router.post("/sources/{source_id}/send-approval")
async def send_approval(source_id: str, current=Depends(get_current_user)):
    business_name = await _current_business_name(current)
    try:
        rec = await airtable_client.get_source_by_id(
            source_id, business_name, owner_id=current["id"]
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    if not rec:
        raise HTTPException(status_code=404, detail="Source not found")
    fields = rec.get("fields", {})
    lifecycle_state = _source_lifecycle_state(fields)
    if lifecycle_state == "approved":
        raise HTTPException(
            status_code=409, detail="This testimonial has already been approved."
        )
    if lifecycle_state not in {"analyzed", "sent"}:
        raise HTTPException(
            status_code=409, detail="Analyze this source before requesting approval."
        )
    testimonial = (fields.get("Testimonial_Draft") or "").strip()
    if not testimonial:
        raise HTTPException(
            status_code=409, detail="A nonempty testimonial is required for approval."
        )
    share_id = fields.get("Share_Id")
    materialized_share_id = not bool(share_id)
    if not share_id:
        try:
            share_id = await _unique_source_share_id(
                preferred=_legacy_source_share_id(source_id, business_name),
                source_id=source_id,
                business_name=business_name,
            )
        except RuntimeError:
            raise HTTPException(
                status_code=503,
                detail="Source storage is temporarily unavailable.",
            ) from None
    now = datetime.now(timezone.utc).isoformat()
    try:
        updated = await airtable_client.update_source_by_id(
            source_id,
            business_name,
            {
                "Approval_Requested_At": now,
                "Share_Id": share_id,
            },
            owner_id=current["id"],
        )
    except AirtableSourceConflictError:
        raise HTTPException(
            status_code=409, detail="Source lifecycle changed; reload and try again."
        ) from None
    except AirtableSourceLookupError:
        raise HTTPException(
            status_code=503, detail="Source storage is temporarily unavailable."
        ) from None
    except Exception as exc:
        logger.warning("Approval-request persistence failed: %s", exc)
        raise HTTPException(status_code=502, detail="Could not send approval.") from None
    if not updated:
        raise HTTPException(status_code=404, detail="Source not found")
    if materialized_share_id:
        try:
            updated = await _verify_persisted_source_share_id(
                updated, business_name=business_name, owner_id=current["id"]
            )
        except RuntimeError:
            raise HTTPException(
                status_code=503,
                detail="Source storage is temporarily unavailable.",
            ) from None
        share_id = updated.get("fields", {}).get("Share_Id") or share_id
    return {"share_id": share_id, "public_path": f"/t/{share_id}"}


# ---------------------------------------------------------------------------
# Channel-intelligent social copy (LinkedIn vs Instagram vs X)
# ---------------------------------------------------------------------------
class SocialGenerateRequest(BaseModel):
    testimonial: str
    attribution: str = ""
    company: str = "PayRewards"
    pov: str = "company"  # "customer" (genuine peer share) | "company" (brand marketing)
    channels: List[str] = ["linkedin", "instagram", "x"]
    tone: str = "professional"


CHANNEL_LIMITS = {"linkedin": 170, "instagram": 150, "x": 120}

SOCIAL_SYSTEM_COMPANY = (
    "You are a senior B2B social media strategist and copywriter for PayRewards (the COMPANY). "
    "You turn an approved customer testimonial into polished, on-brand posts published from the "
    "PayRewards company account — someone on the marketing team amplifying a customer's words. "
    "You understand that LinkedIn, Instagram and X each need a different voice, hook, length and "
    "hashtag style, and you never reuse the same caption across channels. "
    "You respond with a single valid JSON object and nothing else."
)

SOCIAL_SYSTEM_CUSTOMER = (
    "You are ghost-writing authentic, personal social posts on behalf of a REAL PERSON — a "
    "customer / demo participant — to share with THEIR OWN professional network. The posts must "
    "sound like a genuine individual casually sharing a useful experience in case it helps someone "
    "in their network. They must NOT sound like an advertisement, must NOT sound like they were "
    "written by a company's marketing team, and must NOT contain sales CTAs, slogans, hype, or "
    "star ratings. Humble, specific, first-person, human. "
    "You respond with a single valid JSON object and nothing else."
)


TONE_GUIDE = {
    "professional": "Polished, credible, business-appropriate. Confident but not showy.",
    "punchy": "Short, bold, high-energy sentences. Strong hooks. Built to stop the scroll.",
    "founder-testimonial": "Reads like a founder personally vouching for the result — earnest, specific, a little vulnerable about the problem it solved.",
    "data-forward": "Leads with the concrete number/result from the testimonial. Precise, ROI-minded, low on adjectives.",
    "warm": "Friendly, human, grateful. Community feel, not corporate.",
}


def build_social_prompt(pov: str, testimonial: str, attribution: str, company: str, channels, tone: str = "professional") -> str:
    person = (attribution or "the customer").split(",")[0].strip()
    header = f"""A customer of {company} shared these approved, verbatim words:
\"\"\"{testimonial}\"\"\"
Person: {attribution or "a " + company + " customer"}.

Write platform-native posts for: {", ".join(channels)}.
Return ONLY JSON shaped exactly like:
{{
  "linkedin": {{ "eyebrow": "", "headline": "", "caption": "", "hashtags": [], "cta": "" }},
  "instagram": {{ "eyebrow": "", "headline": "", "caption": "", "hashtags": [], "cta": "" }},
  "x": {{ "eyebrow": "", "headline": "", "caption": "", "hashtags": [], "cta": "" }}
}}
(Only include the channels requested. "hashtags" WITHOUT the # symbol.)

FAITHFULNESS (critical): Every "caption" and "headline" MUST be directly grounded in and consistent with the SPECIFIC points and genuine sentiment in the testimonial above. Only paraphrase or lightly expand what the customer ACTUALLY said. NEVER invent new claims, situations, intentions or timelines that are not in the testimonial (for example: do NOT write that they are "considering it for future projects", "finalizing internal plans", or anything the testimonial does not state). If the testimonial is positive and present-tense, keep the post positive and present-tense; if it contains a nuance you may reflect it honestly. The post should feel like the same person who gave the testimonial, talking about the same things.
"""

    tone_line = f"\nOVERALL TONE for every channel: \"{tone}\" — {TONE_GUIDE.get(tone, TONE_GUIDE['professional'])}\n"

    if pov == "customer":
        rules = tone_line + f"""VOICE: FIRST PERSON as {person}, posting to their OWN network (not the company).
Make it a genuine, low-key share — "sharing in case it's useful to anyone in my network." It is fine
to name {company} as part of the story, but it must NOT read like a promotion.

HARD RULES:
- NO sales CTAs (no "link in bio", "DM us", "check them out", "book a demo"). "cta" MUST be "".
- NO star ratings, NO marketing hype, NO slogans, NO "we're proud", NO company voice.
- "eyebrow" MUST be "" (empty) for every channel.
- "headline": a short, personal takeaway in {person}'s own voice (<= 42 chars). Understated. May be a plain observation.
- Keep hashtags minimal and natural.

CHANNEL VOICE (make them clearly different):
- linkedin: reflective, professional peer voice. caption = 2-3 short first-person paragraphs, a real insight. 0-2 subtle hashtags.
- instagram: casual and personal. caption = short warm lines, 0-2 emojis max. 0-3 low-key hashtags.
- x: one genuine quick thought. caption <= 230 characters. 0-1 hashtag.

The customer's quote is rendered separately on the image; do not repeat it verbatim inside the caption block."""
    else:
        rules = tone_line + f"""VOICE: PayRewards brand / marketing team amplifying a customer's words. Polished and credible.

Field rules:
- "eyebrow": 1-3 word ALL-CAPS kicker (e.g. "CUSTOMER STORY", "REAL RESULTS", "PROOF").
- "headline": a punchy on-image hook framing the quote, brand voice.
- "cta": a short call to action fitting the channel.

CHANNEL VOICE (make them clearly different):
- linkedin: credible, insight-led, professional. headline <= 60 chars. caption = 2-3 short paragraphs from the PayRewards team, at most 1 emoji. 3 focused B2B hashtags. cta like "See how it works".
- instagram: warm, energetic, human. headline <= 38 chars. caption = short lines + line breaks + 2-4 tasteful emojis. 6-8 hashtags. cta like "Link in bio".
- x: concise and witty. headline <= 30 chars. caption <= 240 characters total. 1-2 hashtags.

The customer's quote is rendered separately on the image; the caption is your original complementary copy."""

    return header + "\n" + rules


def _verbatim_excerpt(testimonial: str, limit: int) -> str:
    t = (testimonial or "").strip().strip('"').strip("\u201c\u201d").strip()
    if len(t) <= limit:
        return t
    cut = t[:limit]
    for sep in [". ", "! ", "? ", " \u2026 ", "\u2026 "]:
        idx = cut.rfind(sep)
        if idx > limit * 0.5:
            return cut[: idx + 1].strip()
    sp = cut.rfind(" ")
    if sp > 0:
        cut = cut[:sp]
    return cut.strip().rstrip(",;:") + "\u2026"


def _fallback_channel(ch: str, company: str, pov: str, person: str) -> dict:
    if pov == "customer":
        base = {
            "linkedin": {"eyebrow": "", "headline": "A genuinely useful find", "caption": f"Sharing in case it's helpful to anyone in my network — {company} has quietly made a real difference in how we work. Happy to compare notes if it's relevant to you.", "hashtags": [], "cta": ""},
            "instagram": {"eyebrow": "", "headline": "Had to share this", "caption": f"Not something I'd normally post, but {company} genuinely surprised me \U0001f642 sharing in case it helps someone.", "hashtags": [], "cta": ""},
            "x": {"eyebrow": "", "headline": "Worth a mention", "caption": f"Sharing in case it helps someone in my network — {company} has been genuinely useful.", "hashtags": [], "cta": ""},
        }
        return base.get(ch, base["linkedin"])
    base = {
        "linkedin": {"eyebrow": "CUSTOMER STORY", "headline": "Real results, in our customer's words", "caption": f"Nothing beats hearing it straight from the people who use {company} every day.", "hashtags": ["CustomerSuccess", "Fintech", "PayRewards"], "cta": "See how it works"},
        "instagram": {"eyebrow": "REAL TALK", "headline": "Straight from a happy customer \u2728", "caption": "When your customers say it better than we ever could \U0001f49c", "hashtags": ["customerlove", "fintech", "rewards", "payrewards", "realresults", "smallbusiness"], "cta": "Link in bio"},
        "x": {"eyebrow": "PROOF", "headline": "In their own words", "caption": "Our customers say it best. \U0001f447", "hashtags": ["fintech", "PayRewards"], "cta": ""},
    }
    return base.get(ch, base["linkedin"])


@api_router.post("/social/generate")
async def social_generate(body: SocialGenerateRequest):
    testimonial = (body.testimonial or "").strip()
    pov = "customer" if body.pov == "customer" else "company"
    person = (body.attribution or "the customer").split(",")[0].strip()
    channels = [c for c in (body.channels or []) if c in CHANNEL_LIMITS] or ["linkedin", "instagram", "x"]
    if not testimonial:
        raise HTTPException(status_code=400, detail="testimonial is required")

    out = {}
    if openai_client:
        system = SOCIAL_SYSTEM_CUSTOMER if pov == "customer" else SOCIAL_SYSTEM_COMPANY
        try:
            raw = await asyncio.to_thread(_call_openai, system, build_social_prompt(pov, testimonial, body.attribution, body.company, channels, body.tone))
            out = _parse_json(raw)
        except Exception as e:  # noqa
            logger.error("social generate failed: %s", e)
            out = {}

    result = {}
    for ch in channels:
        gen = out.get(ch) if isinstance(out, dict) else None
        if not isinstance(gen, dict):
            gen = _fallback_channel(ch, body.company, pov, person)
        gen["quote"] = _verbatim_excerpt(testimonial, CHANNEL_LIMITS[ch])
        tags = gen.get("hashtags") or []
        gen["hashtags"] = [str(t).lstrip("#").strip() for t in tags if str(t).strip()]
        for k in ("eyebrow", "headline", "caption", "cta"):
            gen[k] = str(gen.get(k) or "").strip()
        if pov == "customer":
            gen["eyebrow"] = ""
            gen["cta"] = ""
        # Always tag the business LinkedIn page in the LinkedIn post.
        if ch == "linkedin":
            handle = "@" + re.sub(r"\s+", "", body.company or "PayRewards")
            if handle.lower() not in (gen.get("caption") or "").lower():
                gen["caption"] = (gen.get("caption", "").rstrip() + f"\n\n{handle}").strip()
        result[ch] = gen

    return {"pov": pov, "channels": result}


# ---------------------------------------------------------------------------
# Referrals — customer refers friends who might find the product useful
# ---------------------------------------------------------------------------
class ReferralItem(BaseModel):
    name: str = ""
    contact: str = ""
    company: str = ""


class ReferralSubmit(BaseModel):
    referrals: List[ReferralItem] = []


class NextAction(BaseModel):
    label: str = ""
    cta: str = "Send Email"


class AgentPlanOut(BaseModel):
    lead_id: str
    status: str = "pending"
    research_headline: str = ""
    research_summary: List[str] = []
    email_subject: str = ""
    email_body: str = ""
    linkedin_message: str = ""
    next_action: NextAction = NextAction()
    generated_at: str = ""


_PLACEHOLDER_CONTACTS = {"n/a", "na", "none", "null", "nil", "unknown", "-"}


def _normalize_referral_key_value(value: str) -> str:
    return " ".join((value or "").strip().casefold().split())


def _referral_key(share_id: str, referral: dict) -> str:
    normalized_values = [
        _normalize_referral_key_value(share_id),
        _normalize_referral_key_value(referral.get("name", "")),
        _normalize_referral_key_value(referral.get("contact", "")),
        _normalize_referral_key_value(referral.get("company", "")),
    ]
    return hashlib.sha256("\x1f".join(normalized_values).encode("utf-8")).hexdigest()


def _airtable_dependency_error(detail: str) -> HTTPException:
    return HTTPException(status_code=502, detail=detail)


@api_router.post("/public/testimonial/{share_id}/referrals")
async def submit_referrals(share_id: str, body: ReferralSubmit):
    doc = await find_public_source(share_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    clean = [
        {
            "name": (r.name or "").strip(),
            "contact": (r.contact or "").strip(),
            "company": (r.company or "").strip(),
        }
        for r in (body.referrals or [])
        if (r.name or "").strip() and (r.contact or "").strip()
    ]
    if not clean:
        raise HTTPException(status_code=400, detail="Please add at least one friend with a name and a way to reach them.")
    if any(
        _normalize_referral_key_value(r["contact"]) in _PLACEHOLDER_CONTACTS
        for r in clean
    ):
        raise HTTPException(
            status_code=400,
            detail="Please add a valid way to reach each friend.",
        )
    if any(not r["company"] for r in clean):
        raise HTTPException(status_code=400, detail="Please add a company name for each friend.")
    ins = doc.get("insights") or {}
    referrer_name = ins.get("speaker_name") or ""

    # Each referred friend becomes a Circles entry (Initiator = referrer, Receiver = referee),
    # plus a User record for the referee enriched via People Data Labs.
    business_name = doc.get("brand") or "PayRewards"
    today = datetime.now(timezone.utc).date().isoformat()
    for r in clean:
        parsed = airtable_client.parse_contact(r["contact"])
        name_parts = r["name"].split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        pdl = await airtable_client.enrich_person_pdl(first_name, last_name, r["company"])
        extra_fields, city, state, country = {}, None, None, None
        pdl_data = (pdl or {}).get("data") or {}

        def _s(v):
            return v if isinstance(v, str) and v else ""

        if pdl_data and isinstance(pdl.get("likelihood"), (int, float)) and pdl.get("likelihood") < 6:
            # Below PDL's recommended confidence threshold (scale is 1-10) — treat as no reliable match
            pdl_data = {}
        if pdl_data:
            extra_fields = {
                "Job_Title": _s(pdl_data.get("job_title")),
                "Company_Name": _s(pdl_data.get("job_company_name")) or r["company"],
                "Industry": _s(pdl_data.get("job_company_industry")),
                "Company_Size": _s(pdl_data.get("job_company_size")),
                "PDL_Likelihood": pdl.get("likelihood") if isinstance(pdl.get("likelihood"), (int, float)) else None,
                "Enriched_At": datetime.now(timezone.utc).isoformat(),
                **airtable_client.summarize_pdl_extra(pdl_data),
            }
            city = _s(pdl_data.get("location_locality")) or None
            state = _s(pdl_data.get("location_region")) or None
            country = _s(pdl_data.get("location_country")) or None
        try:
            user_record_id = await airtable_client.find_or_create_user(
                name=r["name"],
                email=parsed.get("email"),
                phone=parsed.get("phone"),
                linkedin=parsed.get("linkedin") or _s(pdl_data.get("linkedin_url")) or None,
                city=city,
                state=state,
                country=country,
                extra_fields=extra_fields,
                strict_persistence=True,
            )
        except Exception:
            logger.exception("Required referral User persistence failed")
            raise _airtable_dependency_error("Referral persistence unavailable")
        if not user_record_id:
            logger.error("Required referral User persistence returned no record ID")
            raise _airtable_dependency_error("Referral persistence unavailable")

        try:
            circle_record_id = await airtable_client.create_circle_record(
                initiator=referrer_name,
                receiver=r["name"],
                business_name=business_name,
                phone=parsed.get("phone") or "",
                referred_date=today,
                receiver_company=r["company"],
                receiver_user_id=user_record_id,
                referrer_testimonial=doc.get("testimonial_draft") or "",
                referral_key=_referral_key(share_id, r),
                strict_persistence=True,
            )
        except Exception:
            logger.exception("Required referral Circle persistence failed")
            raise _airtable_dependency_error("Referral persistence unavailable")
        if not circle_record_id:
            logger.error("Required referral Circle persistence returned no record ID")
            raise _airtable_dependency_error("Referral persistence unavailable")
    return {"count": len(clean)}


@api_router.post("/events/log")
async def log_event_endpoint(body: EventLogRequest):
    await airtable_client.log_event(event=body.event, page=body.page, share_id=body.share_id, details=body.details)
    return {"ok": True}


@api_router.get("/testimonials")
async def get_testimonials(current=Depends(get_current_user)):
    business_name = (
        await airtable_client.get_business_name_by_email_domain(current["email"])
        or current["company"]
    )
    return await airtable_client.list_uplaud_by_business(business_name)



@api_router.get("/warm-leads")
async def get_warm_leads(current=Depends(get_current_user)):
    business_name = (
        await airtable_client.get_business_name_by_email_domain(current["email"])
        or current["company"]
    )
    leads = await airtable_client.list_circles_by_business(business_name)
    return {"business_name": business_name, "leads": leads}


@api_router.post("/warm-leads/{lead_id}/agent-run", response_model=AgentPlanOut)
async def run_referral_agent(lead_id: str, force: bool = False, current=Depends(get_current_user)):
    business_name = (
        await airtable_client.get_business_name_by_email_domain(current["email"])
        or current["company"]
    )
    lead = await airtable_client.get_circle_lead(business_name, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    existing = lead.get("agent_plan")
    if existing and not force:
        return AgentPlanOut(**existing)

    if not openai_client:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured on the server.")

    research_bullets = await research_lead(lead)
    preferred_channel = _infer_preferred_channel(lead, research_bullets)
    draft = await draft_outreach(lead, lead.get("referrer_testimonial", ""), research_bullets, business_name, preferred_channel)

    plan = {
        "lead_id": lead_id,
        "status": "pending",
        "research_headline": (draft.get("research_headline") or "").strip(),
        "research_summary": research_bullets,
        "email_subject": (draft.get("email_subject") or "").strip(),
        "email_body": (draft.get("email_body") or "").strip(),
        "linkedin_message": (draft.get("linkedin_message") or "").strip(),
        "next_action": {
            "label": (draft.get("next_action_label") or "Send a personalized intro").strip(),
            "cta": preferred_channel,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    await airtable_client.update_circle_agent_plan(lead_id, plan)
    return AgentPlanOut(**plan)


@api_router.post("/warm-leads/{lead_id}/agent-plan/{action}", response_model=AgentPlanOut)
async def update_agent_plan_status(lead_id: str, action: str, current=Depends(get_current_user)):
    if action not in ("approve", "skip"):
        raise HTTPException(status_code=404, detail="Not found")
    business_name = (
        await airtable_client.get_business_name_by_email_domain(current["email"])
        or current["company"]
    )
    lead = await airtable_client.get_circle_lead(business_name, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    existing = lead.get("agent_plan")
    if not existing:
        raise HTTPException(status_code=404, detail="No agent plan found for this lead yet.")
    validated = AgentPlanOut(**existing)
    new_status = "approved" if action == "approve" else "skipped"
    updated = AgentPlanOut(**{**validated.model_dump(), "status": new_status})
    await airtable_client.update_circle_agent_plan_status(lead_id, new_status)
    return updated


# ---------------------------------------------------------------------------
# Routes: blog
# ---------------------------------------------------------------------------
def check_admin_token(request: Request):
    token = request.headers.get("X-Admin-Token", "").strip()
    expected = os.environ.get("ADMIN_PASSWORD", "P@yRew@rds123").strip()
    if not token or token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized admin token")
    return token


@api_router.get("/blog", response_model=BlogListResponse)
async def list_blog_posts(limit: int = 50):
    docs = await airtable_client.list_blog_posts_airtable(limit, published_only=True)
    return BlogListResponse(posts=docs)


@api_router.get("/blog/{slug}", response_model=BlogPostOut)
async def get_blog_post(slug: str):
    doc = await airtable_client.get_blog_post_airtable(slug)
    if not doc:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogPostOut(**doc)


@api_router.get("/admin/blog", response_model=BlogListResponse)
async def admin_list_blog_posts(limit: int = 200, token: str = Depends(check_admin_token)):
    docs = await airtable_client.list_blog_posts_airtable(limit, published_only=False)
    return BlogListResponse(posts=docs)


@api_router.post("/blog", response_model=BlogPostOut)
async def create_blog_post(body: BlogPostIn, token: str = Depends(check_admin_token)):
    slug = (body.slug or "").strip().lower()
    if not slug:
        slug = re.sub(r"[^\w\s-]", "", body.title.lower())
        slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    
    # Check if slug exists in Airtable
    existing = await airtable_client.get_blog_post_airtable(slug)
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
        
    post_data = {
        "title": body.title,
        "slug": slug,
        "excerpt": body.excerpt,
        "content": body.content,
        "cover_image": body.cover_image,
        "tag": body.tag,
        "author": body.author or "Uplaud Team",
        "published": body.published,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    doc = await airtable_client.create_blog_post_airtable(post_data)
    if not doc:
        raise HTTPException(status_code=500, detail="Failed to create blog post in Airtable")
    return BlogPostOut(**doc)


@api_router.put("/blog/{slug}", response_model=BlogPostOut)
async def update_blog_post(slug: str, body: BlogPostIn, token: str = Depends(check_admin_token)):
    post = await airtable_client.get_blog_post_airtable(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    new_slug = (body.slug or "").strip().lower()
    if not new_slug:
        new_slug = slug
    elif new_slug != slug:
        existing = await airtable_client.get_blog_post_airtable(new_slug)
        if existing:
            raise HTTPException(status_code=400, detail="Slug already in use")
    
    update_data = {
        "title": body.title,
        "slug": new_slug,
        "excerpt": body.excerpt,
        "content": body.content,
        "cover_image": body.cover_image,
        "tag": body.tag,
        "author": body.author,
        "published": body.published,
    }
    doc = await airtable_client.update_blog_post_airtable(slug, update_data)
    if not doc:
        raise HTTPException(status_code=500, detail="Failed to update blog post in Airtable")
    return BlogPostOut(**doc)


@api_router.delete("/blog/{slug}")
async def delete_blog_post(slug: str, token: str = Depends(check_admin_token)):
    success = await airtable_client.delete_blog_post_airtable(slug)
    if not success:
        raise HTTPException(status_code=404, detail="Blog post not found in Airtable")
    return {"status": "ok"}


@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), token: str = Depends(check_admin_token)):
    filename = file.filename or ""
    extension = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""
    content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    if ALLOWED_BLOG_IMAGE_TYPES.get(extension) != content_type:
        raise HTTPException(
            status_code=400,
            detail="Upload a supported image with a matching file extension.",
        )
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large. Maximum size is {MAX_UPLOAD_BYTES} bytes.",
        )
    try:
        with Image.open(io.BytesIO(content)) as image:
            detected_content_type = BLOG_IMAGE_FORMAT_TYPES.get(image.format or "")
            image.verify()
    except (
        Image.DecompressionBombError,
        UnidentifiedImageError,
        NotImplementedError,
        OSError,
        SyntaxError,
        ValueError,
    ):
        raise HTTPException(
            status_code=400, detail="The uploaded file is not a valid image."
        ) from None
    if detected_content_type != content_type:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image content does not match its declared type.",
        )
    try:
        url = await blob_storage.store_blog_image(filename, content, content_type)
    except blob_storage.BlobStorageUnavailable:
        raise HTTPException(
            status_code=503, detail="Image storage is temporarily unavailable."
        ) from None
    except blob_storage.BlobStorageError:
        raise HTTPException(
            status_code=502, detail="Could not persist the uploaded image."
        ) from None
    return {"url": url}


@api_router.post("/blog/lead-magnet")
async def blog_lead_magnet(body: LeadMagnetRequest):
    email = body.email.lower().strip()
    slug = body.slug.strip()

    name_part = email.split("@")[0].title().replace(".", " ").replace("-", " ")
    try:
        user_record_id = await airtable_client.find_or_create_user(
            name=name_part,
            email=email,
            extra_fields={"Interests": f"Blog Lead Magnet: {slug}"},
            strict_persistence=True,
        )
    except Exception:
        logger.exception("Required blog lead persistence failed")
        raise _airtable_dependency_error("Lead persistence unavailable")
    if not user_record_id:
        logger.error("Required blog lead persistence returned no record ID")
        raise _airtable_dependency_error("Lead persistence unavailable")

    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
