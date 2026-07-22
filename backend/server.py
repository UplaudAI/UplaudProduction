from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import json
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from docx import Document as DocxDocument
from pypdf import PdfReader
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------------------------------------------------------------------------
# Config / DB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "uplaud-demo-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 12
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-5.5")

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
    share_id: str = ""
    testimonial_status: str = "draft"
    approved_at: Optional[str] = None
    approval_requested_at: Optional[str] = None


class PublicTestimonial(BaseModel):
    share_id: str
    company_name: str
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


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
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


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        company=user["company"],
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
# LLM
# ---------------------------------------------------------------------------
INSIGHTS_SYSTEM = (
    "You are an expert B2B customer-insights analyst for Uplaud, a customer-led growth platform. "
    "You analyze sales/demo call transcripts and extract structured growth signals. "
    "You always respond with a single valid JSON object and nothing else."
)


def build_insights_prompt(transcript: str, client_name: str) -> str:
    return f"""Analyze the following client sales/demo call transcript. The uploaded file is named after "{client_name}".

Return ONLY a JSON object with EXACTLY these keys (use empty arrays/strings when nothing applies):
{{
  "company_name": "the customer/company name mentioned in the call (not the seller). Fall back to a clean version of the file name if unknown",
  "speaker_name": "full name of the primary customer speaker (the buyer), if mentioned",
  "speaker_role": "the customer speaker's job title/role, if mentioned",
  "ae_name": "the name of the seller / account executive on the call, if mentioned",
  "sentiment_label": "one of: Positive, Neutral, Negative",
  "signal_score": 0,
  "call_type": "one of: Demo, Discovery, Onboarding, Support, Renewal",
  "summary": "2-3 sentence summary of the conversation",
  "motivations": ["what is motivating the customer / why they are looking (short phrases)"],
  "pain_points": ["specific pains, frustrations or problems the customer described"],
  "buying_signals": ["statements or questions indicating buying intent"],
  "objections": ["concerns, blockers or objections the customer raised"],
  "customer_language": ["short verbatim quotes in the customer's own words that are quotable/memorable"],
  "product_feedback": ["product feedback, feature requests or praise the customer gave"],
  "faqs": ["explicit questions the customer asked"],
  "testimonial_draft": "A polished, authentic 2-4 sentence testimonial written in the customer's first-person voice, grounded in their highest-sentiment comments and any concrete numbers/outcomes they mentioned. Sounds like a real person, not marketing copy."
}}

Rules:
- signal_score is an integer from 0 to 100 representing overall opportunity strength (sentiment + buying intent).
- customer_language items must be verbatim customer quotes (no added quotation marks in the string).
- Only include items that are actually supported by the transcript. Keep each item short (one line).

Transcript:
\"\"\"
{transcript[:12000]}
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


async def generate_insights(transcript: str, client_name: str) -> dict:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured on the server.")
    chat = LlmChat(
        api_key=OPENAI_API_KEY,
        session_id=f"insights-{uuid.uuid4()}",
        system_message=INSIGHTS_SYSTEM,
    ).with_model("openai", LLM_MODEL)
    resp = await chat.send_message(UserMessage(text=build_insights_prompt(transcript, client_name)))
    text = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
    try:
        return _parse_json(text)
    except Exception as e:
        logger.error("Failed to parse LLM JSON: %s | raw: %s", e, text[:500])
        raise HTTPException(status_code=502, detail="Could not parse insights from the model.")


# ---------------------------------------------------------------------------
# Routes: auth
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Uplaud Growth Engine API"}


@api_router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return LoginResponse(token=token, user=user_to_out(user))


@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return user_to_out(current)


# ---------------------------------------------------------------------------
# Routes: sources
# ---------------------------------------------------------------------------
def source_to_out(doc: dict) -> SourceOut:
    return SourceOut(
        id=doc["id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        client_name=doc["client_name"],
        conversation_code=doc.get("conversation_code", "CV_001"),
        source_name=doc.get("source_name", "Upload"),
        duration_min=doc.get("duration_min", 0),
        word_count=doc["word_count"],
        status=doc["status"],
        created_at=doc["created_at"],
        insights=doc.get("insights"),
        testimonial_draft=doc.get("testimonial_draft"),
        share_id=doc.get("share_id", ""),
        testimonial_status=doc.get("testimonial_status", "draft"),
        approved_at=doc.get("approved_at"),
        approval_requested_at=doc.get("approval_requested_at"),
    )


@api_router.post("/sources", response_model=SourceOut)
async def upload_source(file: UploadFile = File(...), current=Depends(get_current_user)):
    content = await file.read()
    text = extract_text(file.filename, content)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
    client_name = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    word_count = len(text.split())
    seq = await db.sources.count_documents({"owner": current["id"]}) + 1
    doc = {
        "id": str(uuid.uuid4()),
        "owner": current["id"],
        "filename": file.filename,
        "file_type": file.filename.rsplit(".", 1)[-1].lower(),
        "client_name": client_name,
        "conversation_code": f"CV_{seq:03d}",
        "source_name": "Upload",
        "duration_min": max(1, round(word_count / 140)),
        "transcript": text,
        "word_count": word_count,
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "insights": None,
        "testimonial_draft": None,
        "share_id": uuid.uuid4().hex[:12],
        "testimonial_status": "draft",
        "approved_at": None,
        "approval_requested_at": None,
    }
    await db.sources.insert_one(doc)
    return source_to_out(doc)


@api_router.get("/sources", response_model=List[SourceOut])
async def list_sources(current=Depends(get_current_user)):
    docs = await db.sources.find({"owner": current["id"]}, {"_id": 0, "transcript": 0}).sort("created_at", -1).to_list(200)
    return [source_to_out(d) for d in docs]


@api_router.get("/sources/{source_id}", response_model=SourceOut)
async def get_source(source_id: str, current=Depends(get_current_user)):
    doc = await db.sources.find_one({"id": source_id, "owner": current["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Source not found")
    return source_to_out(doc)


@api_router.post("/sources/{source_id}/analyze", response_model=SourceOut)
async def analyze_source(source_id: str, current=Depends(get_current_user)):
    doc = await db.sources.find_one({"id": source_id, "owner": current["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Source not found")
    result = await generate_insights(doc["transcript"], doc["client_name"])
    testimonial = result.pop("testimonial_draft", "")
    insights = Insights(**result)
    await db.sources.update_one(
        {"id": source_id},
        {"$set": {"insights": insights.model_dump(), "testimonial_draft": testimonial, "status": "analyzed"}},
    )
    doc.update({"insights": insights.model_dump(), "testimonial_draft": testimonial, "status": "analyzed"})
    return source_to_out(doc)


@api_router.put("/sources/{source_id}/testimonial", response_model=SourceOut)
async def update_testimonial(source_id: str, body: TestimonialUpdate, current=Depends(get_current_user)):
    doc = await db.sources.find_one({"id": source_id, "owner": current["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.sources.update_one({"id": source_id}, {"$set": {"testimonial_draft": body.testimonial_draft}})
    doc["testimonial_draft"] = body.testimonial_draft
    return source_to_out(doc)


@api_router.get("/sources/{source_id}/email-draft", response_model=EmailDraft)
async def email_draft(source_id: str, current=Depends(get_current_user)):
    doc = await db.sources.find_one({"id": source_id, "owner": current["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Source not found")
    client = doc["client_name"]
    ins = doc.get("insights") or {}
    company = ins.get("company_name") or client
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
        to=doc.get("client_email", ""),
        subject=subject,
        body=body,
        attachment_name=f"{client} - Conversation Summary.pdf",
    )


def _public_payload(doc: dict) -> PublicTestimonial:
    ins = doc.get("insights") or {}
    return PublicTestimonial(
        share_id=doc["share_id"],
        company_name=ins.get("company_name") or doc.get("client_name", ""),
        speaker_name=ins.get("speaker_name") or "",
        speaker_role=ins.get("speaker_role") or "",
        testimonial=doc.get("testimonial_draft") or "",
        status=doc.get("testimonial_status") or "draft",
        approved_at=doc.get("approved_at"),
    )


@api_router.get("/public/testimonial/{share_id}", response_model=PublicTestimonial)
async def public_get_testimonial(share_id: str):
    doc = await db.sources.find_one({"share_id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return _public_payload(doc)


@api_router.put("/public/testimonial/{share_id}", response_model=PublicTestimonial)
async def public_update_testimonial(share_id: str, body: PublicUpdate):
    doc = await db.sources.find_one({"share_id": share_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    if doc.get("testimonial_status") == "approved":
        raise HTTPException(status_code=400, detail="This testimonial is already approved and locked.")
    await db.sources.update_one({"share_id": share_id}, {"$set": {"testimonial_draft": body.testimonial_draft}})
    doc["testimonial_draft"] = body.testimonial_draft
    return _public_payload(doc)


@api_router.post("/public/testimonial/{share_id}/approve", response_model=PublicTestimonial)
async def public_approve_testimonial(share_id: str):
    doc = await db.sources.find_one({"share_id": share_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.sources.update_one(
        {"share_id": share_id},
        {"$set": {"testimonial_status": "approved", "approved_at": now}},
    )
    doc["testimonial_status"] = "approved"
    doc["approved_at"] = now
    return _public_payload(doc)


@api_router.post("/sources/{source_id}/send-approval")
async def send_approval(source_id: str, current=Depends(get_current_user)):
    doc = await db.sources.find_one({"id": source_id, "owner": current["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Source not found")
    now = datetime.now(timezone.utc).isoformat()
    share_id = doc.get("share_id") or uuid.uuid4().hex[:12]
    await db.sources.update_one(
        {"id": source_id},
        {"$set": {"testimonial_status": "sent", "approval_requested_at": now, "share_id": share_id}},
    )
    return {"share_id": share_id, "public_path": f"/t/{share_id}"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.sources.create_index("owner")
    admin_email = os.environ["ADMIN_EMAIL"].lower().strip()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "David Cameron",
            "role": "Head of Marketing",
            "company": "PayRewards",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded demo user %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated demo user password for %s", admin_email)


@app.on_event("shutdown")
async def shutdown():
    client.close()
