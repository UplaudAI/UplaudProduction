from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import resend
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
            "message": "Your request was received. We'll be in touch shortly.",
        }

    return {
        "id": lead.id,
        "status": "sent",
        "email_sent": True,
        "message": "Thanks — we'll be in touch shortly.",
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
