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


class Highlight(BaseModel):
    quote: str
    speaker: str
    sentiment_score: float


class Insights(BaseModel):
    summary: str
    key_themes: List[str]
    sentiment_overview: str
    sentiment_score: float
    highlights: List[Highlight]
    pain_points: List[str]
    buying_signals: List[str]


class SourceOut(BaseModel):
    id: str
    filename: str
    file_type: str
    client_name: str
    word_count: int
    status: str
    created_at: str
    insights: Optional[Insights] = None
    testimonial_draft: Optional[str] = None


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
    return f"""Analyze the following client demo call transcript for the client "{client_name}".

Return ONLY a JSON object with EXACTLY these keys:
{{
  "summary": "2-3 sentence summary of the conversation",
  "key_themes": ["4-6 short theme phrases discussed"],
  "sentiment_overview": "1-2 sentences describing the client's overall sentiment",
  "sentiment_score": 0.0,
  "highlights": [
    {{"quote": "verbatim positive/high-sentiment quote from the client", "speaker": "who said it", "sentiment_score": 0.0}}
  ],
  "pain_points": ["client pain points or objections mentioned"],
  "buying_signals": ["signals that indicate buying intent"],
  "testimonial_draft": "A polished, authentic 2-3 sentence testimonial quote written in the client's voice, based on the highest-sentiment comments and exclamations they made. First person, warm, specific and credible."
}}

Rules:
- sentiment_score is a float from 0 (very negative) to 1 (very positive).
- highlights must be the 3-5 highest-sentiment, most quotable client statements. Use verbatim text where possible.
- The testimonial_draft must sound like a real customer quote, not marketing copy.

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
        word_count=doc["word_count"],
        status=doc["status"],
        created_at=doc["created_at"],
        insights=doc.get("insights"),
        testimonial_draft=doc.get("testimonial_draft"),
    )


@api_router.post("/sources", response_model=SourceOut)
async def upload_source(file: UploadFile = File(...), current=Depends(get_current_user)):
    content = await file.read()
    text = extract_text(file.filename, content)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
    client_name = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    doc = {
        "id": str(uuid.uuid4()),
        "owner": current["id"],
        "filename": file.filename,
        "file_type": file.filename.rsplit(".", 1)[-1].lower(),
        "client_name": client_name,
        "transcript": text,
        "word_count": len(text.split()),
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "insights": None,
        "testimonial_draft": None,
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
    testimonial = doc.get("testimonial_draft") or ""
    first = client.split(" ")[0]
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
