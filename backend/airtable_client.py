import os
import re
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

logger = logging.getLogger("uplaud.airtable")

AIRTABLE_PAT = os.environ.get("AIRTABLE_PAT", "")
AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "")
AIRTABLE_API_URL = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}"
PDL_API_KEY = os.environ.get("PDL_API_KEY", "")
PDL_ENRICH_URL = "https://api.peopledatalabs.com/v5/person/enrich"

TABLE_USER = "User"
TABLE_UPLAUD = "Uplaud"
TABLE_BUSINESS = "Business"
TABLE_CIRCLES = "Circles"
TABLE_EVENT_LOG = "Event_Log"


def _enabled() -> bool:
    return bool(AIRTABLE_PAT and AIRTABLE_BASE_ID)


def _headers() -> dict:
    return {"Authorization": f"Bearer {AIRTABLE_PAT}", "Content-Type": "application/json"}


def _escape(v: str) -> str:
    return (v or "").replace('"', '\\"')


async def _get(table: str, params: Optional[dict] = None) -> dict:
    if not _enabled():
        return {"records": []}
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{AIRTABLE_API_URL}/{table}", headers=_headers(), params=params or {})
        r.raise_for_status()
        return r.json()


async def _get_record(table: str, record_id: str) -> Optional[dict]:
    if not _enabled():
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{AIRTABLE_API_URL}/{table}/{record_id}", headers=_headers())
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()


async def _create(table: str, fields: dict) -> Optional[dict]:
    if not _enabled():
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{AIRTABLE_API_URL}/{table}", headers=_headers(), json={"fields": fields})
        r.raise_for_status()
        return r.json()


async def _update(table: str, record_id: str, fields: dict) -> Optional[dict]:
    if not _enabled():
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.patch(f"{AIRTABLE_API_URL}/{table}/{record_id}", headers=_headers(), json={"fields": fields})
        r.raise_for_status()
        return r.json()


async def enrich_person_pdl(first_name: str, last_name: str, company: str) -> Optional[dict]:
    """Call People Data Labs Person Enrichment API. Returns the raw {status, likelihood, data} payload, or None."""
    if not PDL_API_KEY or not (first_name or last_name):
        return None
    params = {}
    if first_name:
        params["first_name"] = first_name
    if last_name:
        params["last_name"] = last_name
    if company:
        params["company"] = company
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(PDL_ENRICH_URL, headers={"X-Api-Key": PDL_API_KEY}, params=params)
        if resp.status_code != 200:
            logger.info("PDL enrichment no match/error: %s %s", resp.status_code, resp.text[:300])
            return None
        return resp.json()
    except Exception as e:
        logger.warning("PDL enrichment request failed: %s", e)
        return None


def _as_list(v) -> list:
    return v if isinstance(v, list) else []


def _as_str(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _join_top(values, n=6) -> str:
    items = [v.strip() for v in _as_list(values) if isinstance(v, str) and v.strip()]
    return ", ".join(items[:n])


def _summarize_education(education) -> str:
    lines = []
    for e in _as_list(education)[:2]:
        if not isinstance(e, dict):
            continue
        school = _as_str((e.get("school") or {}).get("name") if isinstance(e.get("school"), dict) else None)
        degrees = ", ".join([d for d in _as_list(e.get("degrees")) if isinstance(d, str)])
        majors = ", ".join([m for m in _as_list(e.get("majors")) if isinstance(m, str)])
        parts = [p for p in [degrees, majors, school] if p]
        if parts:
            lines.append(" - ".join(parts))
    return "; ".join(lines)


def _most_recent_previous_company(experience, current_company: str) -> str:
    past = [
        e for e in _as_list(experience)
        if isinstance(e, dict) and isinstance(e.get("company"), dict) and e["company"].get("name")
        and e["company"].get("name") != current_company
        and not e.get("is_primary")
    ]
    past.sort(key=lambda e: _as_str(e.get("end_date")), reverse=True)
    return _as_str(past[0]["company"].get("name")) if past else ""


def summarize_pdl_extra(pdl_data: dict) -> dict:
    """Extract the additional People Data Labs fields not already covered by
    the core Job_Title/Company_Name/Industry/Company_Size/Enriched_At columns.
    PDL returns booleans instead of real values for some PII fields when the
    data exists but isn't included at the current API plan tier — those are skipped."""
    if not pdl_data:
        return {}
    current_company = _as_str(pdl_data.get("job_company_name"))
    phone_numbers = [p for p in _as_list(pdl_data.get("phone_numbers")) if isinstance(p, str) and p]
    mobile_phone = pdl_data.get("mobile_phone")
    mobile_phone = mobile_phone if isinstance(mobile_phone, str) else (phone_numbers[0] if phone_numbers else "")
    out = {
        "Work_Email": _as_str(pdl_data.get("work_email")),
        "Mobile_Phone": _as_str(mobile_phone),
        "Skills": _join_top(pdl_data.get("skills"), 8),
        "Interests": _join_top(pdl_data.get("interests"), 8),
        "Education": _summarize_education(pdl_data.get("education")),
        "Previous_Company": _most_recent_previous_company(pdl_data.get("experience"), current_company),
        "Job_Start_Date": _as_str(pdl_data.get("job_start_date")),
        "Twitter_URL": _as_str(pdl_data.get("twitter_url")),
        "Github_URL": (pdl_data.get("github_url") or "").strip(),
    }
    return {k: v for k, v in out.items() if v}


def parse_contact(contact: str) -> dict:
    """Best-effort guess of what a free-text referral contact represents."""
    c = (contact or "").strip()
    if "@" in c and "." in c.split("@")[-1]:
        return {"email": c}
    digits = re.sub(r"[^\d]", "", c)
    if len(digits) >= 7:
        return {"phone": c}
    if "linkedin" in c.lower() or c.lower().startswith("http"):
        return {"linkedin": c}
    return {"linkedin": c} if c else {}


async def get_business_name_by_email_domain(email: str) -> Optional[str]:
    """Resolve Business_Name from the Business table's Business Domain field for the given email's domain."""
    if not email or "@" not in email:
        return None
    domain = email.split("@", 1)[1].strip().lower()
    try:
        data = await _get(TABLE_BUSINESS, {"pageSize": 100})
    except Exception as e:
        logger.warning("Airtable business lookup failed: %s", e)
        return None
    for rec in data.get("records", []):
        fields = rec.get("fields", {})
        biz_domain = (fields.get("Business Domain") or "").lower()
        biz_domain = re.sub(r"^https?://", "", biz_domain).rstrip("/")
        if biz_domain and (biz_domain == domain or domain.endswith(biz_domain) or biz_domain.endswith(domain)):
            return fields.get("Business Name")
    return None


async def find_or_create_user(
    name: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
    linkedin: Optional[str] = None,
    extra_fields: Optional[dict] = None,
) -> Optional[str]:
    """Find a User record by Profile Email or Phone, else create one. Returns the Airtable record id.

    If found, also patches in any newly-provided fields (e.g. enrichment data) instead of leaving them stale.
    """
    name = (name or "").strip() or "Unknown"
    existing_id = None
    try:
        if email:
            formula = f'LOWER({{Profile Email}})="{_escape(email.lower())}"'
            data = await _get(TABLE_USER, {"filterByFormula": formula, "maxRecords": 1})
            recs = data.get("records", [])
            if recs:
                existing_id = recs[0]["id"]
        elif phone:
            formula = f'{{Phone}}="{_escape(phone)}"'
            data = await _get(TABLE_USER, {"filterByFormula": formula, "maxRecords": 1})
            recs = data.get("records", [])
            if recs:
                existing_id = recs[0]["id"]
    except Exception as e:
        logger.warning("Airtable user lookup failed: %s", e)

    fields = {"Name": name}
    if email:
        fields["Profile Email"] = email
    if phone:
        fields["Phone"] = phone
    if city:
        fields["City"] = city
    if state:
        fields["State"] = state
    if country:
        fields["Country"] = country
    if linkedin:
        fields["LinkedIn Profile"] = linkedin
    if extra_fields:
        fields.update({k: v for k, v in extra_fields.items() if v not in (None, "")})

    if existing_id:
        try:
            await _update(TABLE_USER, existing_id, fields)
        except Exception as e:
            logger.warning("Airtable user update failed: %s", e)
        return existing_id

    try:
        rec = await _create(TABLE_USER, fields)
        return rec["id"] if rec else None
    except Exception as e:
        logger.warning("Airtable user create failed: %s", e)
        return None


async def create_uplaud_record(
    business_name: str,
    testimonial: str,
    reviewer_record_id: Optional[str] = None,
    share_link: str = "",
    date_added: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
) -> Optional[str]:
    fields = {"business_name": business_name or "", "Uplaud": testimonial or ""}
    if reviewer_record_id:
        fields["Reviewer"] = [reviewer_record_id]
    if share_link:
        fields["Share Link"] = share_link
    if date_added:
        fields["Date_Added"] = date_added
    if city:
        fields["City"] = city
    if state:
        fields["State"] = state
    if country:
        fields["Country"] = country
    try:
        rec = await _create(TABLE_UPLAUD, fields)
        return rec["id"] if rec else None
    except Exception as e:
        logger.warning("Airtable uplaud create failed: %s", e)
        return None


async def create_circle_record(
    initiator: str,
    receiver: str,
    business_name: str = "",
    phone: str = "",
    referred_date: Optional[str] = None,
    receiver_company: str = "",
    receiver_user_id: Optional[str] = None,
    referrer_testimonial: str = "",
) -> Optional[str]:
    fields = {"Initiator": initiator or "", "Receiver": receiver or "", "Business_Name": business_name or ""}
    if phone:
        fields["phone"] = phone
    if referred_date:
        fields["Referred_Date"] = referred_date
    if receiver_company:
        fields["ReceiverCompany"] = receiver_company
    if receiver_user_id:
        fields["UserTable Link"] = [receiver_user_id]
    if referrer_testimonial:
        fields["Referrer_Testimonial"] = referrer_testimonial
    try:
        rec = await _create(TABLE_CIRCLES, fields)
        return rec["id"] if rec else None
    except Exception as e:
        logger.warning("Airtable circle create failed: %s", e)
        return None


def _circle_to_lead_dict(f: dict, uf: dict, record_id: str, created_time: str = "") -> dict:
    return {
        "id": record_id,
        "created_at": created_time or "",
        "referrer_name": f.get("Initiator", ""),
        "name": f.get("Receiver", ""),
        "receiver_company": f.get("ReceiverCompany", ""),
        "referred_date": f.get("Referred_Date", ""),
        "phone": f.get("phone", ""),
        "referrer_testimonial": f.get("Referrer_Testimonial", ""),
        "job_title": uf.get("Job_Title", ""),
        "company_name": uf.get("Company_Name", ""),
        "industry": uf.get("Industry", ""),
        "company_size": uf.get("Company_Size", ""),
        "city": uf.get("City", ""),
        "state": uf.get("State", ""),
        "country": uf.get("Country", ""),
        "linkedin": uf.get("LinkedIn Profile", ""),
        "pdl_likelihood": uf.get("PDL_Likelihood"),
        "work_email": uf.get("Work_Email", ""),
        "mobile_phone": uf.get("Mobile_Phone", ""),
        "skills": uf.get("Skills", ""),
        "interests": uf.get("Interests", ""),
        "education": uf.get("Education", ""),
        "previous_company": uf.get("Previous_Company", ""),
        "job_start_date": uf.get("Job_Start_Date", ""),
        "twitter_url": uf.get("Twitter_URL", ""),
        "github_url": uf.get("Github_URL", ""),
    }


async def get_circle_lead(business_name: str, lead_id: str) -> Optional[dict]:
    """Fetch a single Circles row (by Airtable record id) joined with its linked User
    enrichment, scoped to the given business for authorization."""
    rec = await _get_record(TABLE_CIRCLES, lead_id)
    if not rec:
        return None
    f = rec.get("fields", {})
    if (f.get("Business_Name") or "") != (business_name or ""):
        return None
    links = f.get("UserTable Link") or []
    uf = {}
    if links:
        u = await _get_record(TABLE_USER, links[0])
        uf = (u or {}).get("fields", {})
    return _circle_to_lead_dict(f, uf, rec.get("id"), rec.get("createdTime", ""))


async def list_circles_by_business(business_name: str) -> list:
    """Return Circles rows (referral entries) for the given business, joined with any linked User enrichment."""
    if not business_name:
        return []
    try:
        formula = f'{{Business_Name}}="{_escape(business_name)}"'
        data = await _get(TABLE_CIRCLES, {"filterByFormula": formula, "pageSize": 100})
    except Exception as e:
        logger.warning("Airtable circles list failed: %s", e)
        return []
    records = data.get("records", [])

    user_ids = set()
    for rec in records:
        user_ids.update(rec.get("fields", {}).get("UserTable Link") or [])
    user_map = {}
    if user_ids:
        try:
            formula = "OR(" + ",".join(f'RECORD_ID()="{uid}"' for uid in user_ids) + ")"
            udata = await _get(TABLE_USER, {"filterByFormula": formula, "pageSize": 100})
            for u in udata.get("records", []):
                user_map[u["id"]] = u.get("fields", {})
        except Exception as e:
            logger.warning("Airtable user batch fetch failed: %s", e)

    out = []
    for rec in records:
        f = rec.get("fields", {})
        links = f.get("UserTable Link") or []
        uf = user_map.get(links[0], {}) if links else {}
        out.append(_circle_to_lead_dict(f, uf, rec.get("id"), rec.get("createdTime", "")))
    return out


def _uplaud_to_testimonial(rec: dict) -> dict:
    f = rec.get("fields", {})
    creators = f.get("Name_Creator") or []
    return {
        "id": rec.get("id"),
        "customer": (creators[0] if creators else "").strip() or "Uplaud customer",
        "body": (f.get("Uplaud") or "").strip(),
        "rating": f.get("Uplaud Score"),
        "source": f.get("Review_Source") or "Uplaud",
        "sentiment": (f.get("NBA_Sentiment") or "").lower(),
        "date_added": f.get("Date_Added") or rec.get("createdTime", "")[:10],
    }


async def list_uplaud_by_business(business_name: str) -> list:
    """Return approved-worthy Uplaud testimonials for the given business (excludes negative sentiment), for social amplification."""
    if not business_name:
        return []
    try:
        formula = f'{{business_name}}="{_escape(business_name)}"'
        data = await _get(TABLE_UPLAUD, {"filterByFormula": formula, "pageSize": 100})
    except Exception as e:
        logger.warning("Airtable uplaud list failed: %s", e)
        return []
    seen = set()
    out = []
    for rec in data.get("records", []):
        t = _uplaud_to_testimonial(rec)
        if not t["body"] or t["sentiment"] == "low":
            continue
        dedupe_key = (t["customer"], t["body"])
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        out.append(t)
    out.sort(key=lambda t: t["date_added"], reverse=True)
    return out


async def log_event(event: str, page: str = "", share_id: str = "", details: str = "", user_email: str = "") -> None:
    fields = {
        "Event": event,
        "Page": page,
        "Share_Id": share_id,
        "Details": details,
        "User_Email": user_email,
        "Logged_At": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await _create(TABLE_EVENT_LOG, fields)
    except Exception as e:
        logger.warning("Airtable event log failed: %s", e)
