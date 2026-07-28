import asyncio
import math
import os
import re
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Optional
from urllib.parse import quote

import httpx

logger = logging.getLogger("uplaud.airtable")


class AirtableSourceLookupError(RuntimeError):
    """A source could not be read from Airtable."""


class AirtableSourcePersistenceError(RuntimeError):
    """A source could not be written to Airtable."""


class AirtableSourceCollisionError(AirtableSourceLookupError):
    """A supposedly unique source capability matched multiple records."""


class AirtableSourceConflictError(RuntimeError):
    """A source mutation conflicts with its current immutable state."""

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

_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
_MAX_ATTEMPTS = 3
_BACKOFF_SECONDS = 0.1
_MAX_RETRY_DELAY_SECONDS = 30.0
_RATE_LIMIT_FALLBACK_SECONDS = 30.0
_USER_BATCH_MAX_IDS = 100
_USER_BATCH_MAX_FORMULA_CHARS = 3500


def _enabled() -> bool:
    return bool(AIRTABLE_PAT and AIRTABLE_BASE_ID)


def _headers() -> dict:
    return {"Authorization": f"Bearer {AIRTABLE_PAT}", "Content-Type": "application/json"}


def _escape(v: str) -> str:
    return (v or "").replace('"', '\\"')


def _retry_delay(
    response: httpx.Response, attempt: int, *, now: Optional[datetime] = None
) -> float:
    retry_after = response.headers.get("Retry-After")
    if retry_after is not None:
        try:
            delay = float(retry_after)
            if math.isfinite(delay) and delay >= 0:
                return min(delay, _MAX_RETRY_DELAY_SECONDS)
        except ValueError:
            pass
        try:
            retry_at = parsedate_to_datetime(retry_after)
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=timezone.utc)
            current_time = now or datetime.now(timezone.utc)
            delay = max(0.0, (retry_at - current_time).total_seconds())
            return min(delay, _MAX_RETRY_DELAY_SECONDS)
        except (TypeError, ValueError, OverflowError):
            pass
    if response.status_code == 429:
        return _RATE_LIMIT_FALLBACK_SECONDS
    return min(_BACKOFF_SECONDS * (2 ** attempt), _MAX_RETRY_DELAY_SECONDS)


async def _request(
    method: str,
    url: str,
    *,
    allow_not_found: bool = False,
    client: Optional[httpx.AsyncClient] = None,
    sleep=None,
    **kwargs,
) -> httpx.Response:
    method = method.upper()
    sleeper = sleep or asyncio.sleep

    async def send(active_client: httpx.AsyncClient) -> httpx.Response:
        for attempt in range(_MAX_ATTEMPTS):
            response = await active_client.request(method, url, headers=_headers(), **kwargs)
            retryable = response.status_code in _RETRYABLE_STATUSES and (
                method != "POST" or response.status_code == 429
            )
            if retryable:
                if attempt == _MAX_ATTEMPTS - 1:
                    response.raise_for_status()
                await sleeper(_retry_delay(response, attempt))
                continue
            if allow_not_found and response.status_code == 404:
                return response
            response.raise_for_status()
            return response
        raise RuntimeError("Airtable request retry loop exited unexpectedly")

    if client is not None:
        return await send(client)
    async with httpx.AsyncClient(timeout=10.0) as owned_client:
        return await send(owned_client)


def _table_url(table: str) -> str:
    return f"{AIRTABLE_API_URL}/{quote(table, safe='')}"


def _record_url(table: str, record_id: str) -> str:
    return f"{_table_url(table)}/{quote(record_id, safe='')}"


async def _get(table: str, params: Optional[dict] = None) -> dict:
    if not _enabled():
        return {"records": []}
    response = await _request("GET", _table_url(table), params=params or {})
    return response.json()


async def _get_all(
    table: str,
    params: Optional[dict] = None,
    *,
    client: Optional[httpx.AsyncClient] = None,
) -> list:
    if not _enabled():
        return []
    query = dict(params or {})
    async def fetch(active_client: httpx.AsyncClient) -> list:
        records = []
        while True:
            response = await _request(
                "GET", _table_url(table), client=active_client, params=dict(query)
            )
            data = response.json()
            records.extend(data.get("records", []))
            offset = data.get("offset")
            if not offset:
                return records
            query["offset"] = offset

    if client is not None:
        return await fetch(client)
    async with httpx.AsyncClient(timeout=10.0) as owned_client:
        return await fetch(owned_client)


async def _get_record(table: str, record_id: str) -> Optional[dict]:
    if not _enabled():
        return None
    response = await _request(
        "GET", _record_url(table, record_id), allow_not_found=True
    )
    if response.status_code == 404:
        return None
    return response.json()


async def _create(table: str, fields: dict) -> Optional[dict]:
    if not _enabled():
        return None
    response = await _request(
        "POST", _table_url(table), json={"fields": fields}
    )
    return response.json()


async def _upsert_by_fields(
    table: str,
    fields: dict,
    fields_to_merge_on: list[str],
) -> dict:
    if not _enabled():
        raise RuntimeError("Airtable is not configured")
    response = await _request(
        "PATCH",
        _table_url(table),
        json={
            "performUpsert": {"fieldsToMergeOn": fields_to_merge_on},
            "records": [{"fields": fields}],
        },
    )
    data = response.json()
    records = data.get("records") if isinstance(data, dict) else None
    if not isinstance(records, list) or not records or not isinstance(records[0], dict):
        raise RuntimeError("Airtable upsert returned no records")
    return records[0]


async def _update(table: str, record_id: str, fields: dict) -> Optional[dict]:
    if not _enabled():
        return None
    response = await _request(
        "PATCH", _record_url(table, record_id), json={"fields": fields}
    )
    return response.json()


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


def _normalize_domain(raw: str) -> str:
    d = (raw or "").lower().strip()
    d = re.sub(r"^https?://", "", d).rstrip("/")
    if d.startswith("www."):
        d = d[4:]
    return d


def _business_name_for_domain(records: list, domain: str) -> Optional[str]:
    """Select an exact Business Domain match before a subdomain match."""
    exact_match, subdomain_match = None, None
    for rec in records:
        fields = rec.get("fields", {})
        biz_domain = _normalize_domain(fields.get("Business Domain") or "")
        if not biz_domain:
            continue
        if biz_domain == domain and exact_match is None:
            exact_match = fields.get("Business Name")
        elif subdomain_match is None and (
            domain.endswith("." + biz_domain) or biz_domain.endswith("." + domain)
        ):
            subdomain_match = fields.get("Business Name")
    return exact_match or subdomain_match


async def get_source_business_name_by_email_domain(email: str) -> Optional[str]:
    """Strictly resolve source tenant scope without hiding Airtable outages."""
    if not email or "@" not in email:
        return None
    if not _enabled():
        raise AirtableSourceLookupError("Airtable business scope is unavailable")
    domain = _normalize_domain(email.split("@", 1)[1])
    try:
        records = await _get_all(TABLE_BUSINESS, {"pageSize": 100})
    except Exception as e:
        logger.warning("Airtable business lookup failed: %s", e)
        raise AirtableSourceLookupError("Airtable business scope lookup failed") from None
    return _business_name_for_domain(records, domain)


async def get_business_name_by_email_domain(email: str) -> Optional[str]:
    """Best-effort business lookup retained for non-source feature fallbacks."""
    try:
        return await get_source_business_name_by_email_domain(email)
    except AirtableSourceLookupError as e:
        logger.warning("Airtable business lookup failed: %s", e)
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
    strict_persistence: bool = False,
) -> Optional[str]:
    """Find a User record by Profile Email or Phone, else create one. Returns the Airtable record id.

    If found, also patches in any newly-provided fields (e.g. enrichment data) instead of leaving them stale.
    With strict_persistence enabled, lookup and write errors propagate instead of
    being logged and converted into the legacy best-effort result.
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
        if strict_persistence:
            raise
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
            updated_record = await _update(TABLE_USER, existing_id, fields)
            if strict_persistence and not updated_record:
                raise RuntimeError("Airtable user update returned no record")
        except Exception as e:
            if strict_persistence:
                raise
            logger.warning("Airtable user update failed: %s", e)
        return existing_id

    try:
        rec = await _create(TABLE_USER, fields)
        return rec["id"] if rec else None
    except Exception as e:
        if strict_persistence:
            raise
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


async def upsert_uplaud_record(
    business_name: str,
    testimonial: str,
    reviewer_record_id: Optional[str] = None,
    share_id: str = "",
    share_link: str = "",
    date_added: Optional[str] = None,
) -> str:
    """Atomically create/update an approved testimonial by stable Share_Id."""
    if not share_id:
        raise RuntimeError("A persisted Share_Id is required")
    fields = {
        "business_name": business_name or "",
        "Uplaud": testimonial or "",
        "Share_Id": share_id,
    }
    if reviewer_record_id:
        fields["Reviewer"] = [reviewer_record_id]
    fields["Share Link"] = share_link
    if date_added:
        fields["Date_Added"] = date_added
    share_id_formula = f'{{Share_Id}}="{_escape(share_id)}"'
    share_id_data = await _get(
        TABLE_UPLAUD, {"filterByFormula": share_id_formula, "maxRecords": 2}
    )
    share_id_records = share_id_data.get("records", [])
    if len(share_id_records) > 1:
        raise RuntimeError("Multiple Uplaud rows match the persisted Share_Id")
    if share_id_records:
        existing = share_id_records[0]
        existing_fields = existing.get("fields", {})
        if existing_fields.get("Share_Id") != share_id:
            raise RuntimeError("Uplaud Share_Id collision detected")
        if (existing_fields.get("business_name") or "") != (business_name or ""):
            raise RuntimeError("Uplaud Share_Id collision detected across businesses")
        updated = await _update(TABLE_UPLAUD, existing["id"], fields)
        if not updated or not updated.get("id"):
            raise RuntimeError("Uplaud persistence failed")
        return updated["id"]

    suffix = f"/t/{share_id}"
    legacy_formula = (
        f'AND({{business_name}}="{_escape(business_name)}",'
        "{Share_Id}=BLANK(),"
        f'RIGHT({{Share Link}},{len(suffix)})="{_escape(suffix)}")'
    )
    legacy_data = await _get(
        TABLE_UPLAUD, {"filterByFormula": legacy_formula, "maxRecords": 2}
    )
    legacy_records = legacy_data.get("records", [])
    if len(legacy_records) > 1:
        raise RuntimeError("Multiple legacy Uplaud rows match the persisted Share_Id")
    if legacy_records:
        existing = legacy_records[0]
        existing_fields = existing.get("fields", {})
        if (
            (existing_fields.get("business_name") or "") != (business_name or "")
            or existing_fields.get("Share_Id")
            or not (existing_fields.get("Share Link") or "").endswith(suffix)
        ):
            raise RuntimeError("Uplaud legacy Share Link collision detected")
        updated = await _update(TABLE_UPLAUD, existing["id"], fields)
        if not updated or not updated.get("id"):
            raise RuntimeError("Uplaud persistence failed")
        return updated["id"]
    record = await _upsert_by_fields(TABLE_UPLAUD, fields, ["Share_Id"])
    return record["id"]


async def create_circle_record(
    initiator: str,
    receiver: str,
    business_name: str = "",
    phone: str = "",
    referred_date: Optional[str] = None,
    receiver_company: str = "",
    receiver_user_id: Optional[str] = None,
    referrer_testimonial: str = "",
    referral_key: str = "",
    strict_persistence: bool = False,
) -> Optional[str]:
    try:
        fields = {
            "Initiator": initiator or "",
            "Receiver": receiver or "",
            "Business_Name": business_name or "",
        }
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
        if referral_key:
            fields["Referral_Key"] = referral_key

        if referral_key:
            rec = await _upsert_by_fields(
                TABLE_CIRCLES,
                fields,
                ["Referral_Key"],
            )
        else:
            rec = await _create(TABLE_CIRCLES, fields)
        record_id = rec.get("id") if rec else None
        if strict_persistence and not record_id:
            raise RuntimeError("Airtable Circle create returned no record ID")
        return record_id
    except Exception as e:
        if strict_persistence:
            raise
        logger.warning("Airtable circle create failed: %s", e)
        return None


_AGENT_PLAN_COMPATIBILITY_FIELDS = (
    "Research_Headline",
    "Research_Summary",
    "Email_Subject",
    "Email_Body",
    "Linkedin_Message",
    "Next_Action_Label",
    "Next_Action_Cta",
)


def _circle_has_agent_plan(f: dict) -> bool:
    if f.get("Agent_Plan_Generated_At"):
        return True
    if any(f.get(field) for field in _AGENT_PLAN_COMPATIBILITY_FIELDS):
        return True
    return f.get("Agent_Plan_Status") in {"approved", "skipped"}


def _circle_to_lead_dict(f: dict, uf: dict, record_id: str, created_time: str = "") -> dict:
    agent_plan = None
    if _circle_has_agent_plan(f):
        agent_plan = {
            "lead_id": record_id,
            "status": f.get("Agent_Plan_Status") or "pending",
            "research_headline": f.get("Research_Headline") or "",
            "research_summary": f.get("Research_Summary", "").split("\n") if f.get("Research_Summary") else [],
            "email_subject": f.get("Email_Subject") or "",
            "email_body": f.get("Email_Body") or "",
            "linkedin_message": f.get("Linkedin_Message") or "",
            "next_action": {
                "label": f.get("Next_Action_Label") or "Send a personalized intro",
                "cta": f.get("Next_Action_Cta") or "Send Email",
            },
            "generated_at": f.get("Agent_Plan_Generated_At") or "",
        }
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
        "agent_plan": agent_plan,
    }


def _chunk_record_ids(record_ids) -> list:
    chunks = []
    current = []
    current_formula_length = len("OR()")
    for record_id in sorted(record_ids):
        clause = f'RECORD_ID()="{_escape(record_id)}"'
        separator_length = 1 if current else 0
        projected_length = current_formula_length + separator_length + len(clause)
        if current and (
            len(current) >= _USER_BATCH_MAX_IDS
            or projected_length > _USER_BATCH_MAX_FORMULA_CHARS
        ):
            chunks.append(current)
            current = []
            current_formula_length = len("OR()")
            separator_length = 0
        current.append(record_id)
        current_formula_length += separator_length + len(clause)
    if current:
        chunks.append(current)
    return chunks


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
        records = await _get_all(TABLE_CIRCLES, {"filterByFormula": formula, "pageSize": 100})
    except Exception as e:
        logger.warning("Airtable circles list failed: %s", e)
        return []

    user_ids = set()
    for rec in records:
        user_ids.update(rec.get("fields", {}).get("UserTable Link") or [])
    user_map = {}
    if user_ids:
        try:
            complete_user_map = {}
            async with httpx.AsyncClient(timeout=10.0) as client:
                for user_id_chunk in _chunk_record_ids(user_ids):
                    formula = "OR(" + ",".join(
                        f'RECORD_ID()="{_escape(user_id)}"' for user_id in user_id_chunk
                    ) + ")"
                    users = await _get_all(
                        TABLE_USER,
                        {"filterByFormula": formula, "pageSize": 100},
                        client=client,
                    )
                    for user in users:
                        complete_user_map[user["id"]] = user.get("fields", {})
            user_map = complete_user_map
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
        records = await _get_all(TABLE_UPLAUD, {"filterByFormula": formula, "pageSize": 100})
    except Exception as e:
        logger.warning("Airtable uplaud list failed: %s", e)
        return []
    seen = set()
    out = []
    for rec in records:
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


TABLE_GROWTH_SIGNALS = "Growth_Signals"


def _source_scope_formula(
    source_id: str, business_name: str, owner_id: Optional[str] = None
) -> str:
    clauses = [
        f'{{Source_Id}}="{_escape(source_id)}"',
        f'{{Business_Name}}="{_escape(business_name)}"',
    ]
    if owner_id:
        # Legacy analyzed rows may predate Owner_Id. They remain available to the
        # owning business, while rows with an owner are restricted to that owner.
        clauses.append(
            "OR("
            f'{{Owner_Id}}="{_escape(owner_id)}",'
            "{Owner_Id}=BLANK()"
            ")"
        )
    return f"AND({','.join(clauses)})"


def _is_analyzed_source_fields(fields: dict) -> bool:
    """Identify analyzed rows, including legacy rows predating Source_Status."""
    explicit_status = (fields.get("Source_Status") or "").strip().lower()
    if explicit_status:
        return explicit_status == "analyzed"
    legacy_analysis_fields = (
        "Person",
        "Company",
        "Signal_Score",
        "Testimonial_Draft",
        "Customer_Language",
    )
    return any(fields.get(field) not in (None, "") for field in legacy_analysis_fields)


def _source_visible_to_owner(fields: dict, owner_id: str) -> bool:
    """Allow owned rows, plus analyzed blank-owner rows shared by the business."""
    persisted_owner = (fields.get("Owner_Id") or "").strip()
    if persisted_owner:
        return persisted_owner == owner_id
    return _is_analyzed_source_fields(fields)


def _source_lifecycle_state(fields: dict) -> str:
    source_status = (
        "analyzed" if _is_analyzed_source_fields(fields) else "uploaded"
    )
    persisted_testimonial_status = (
        fields.get("Testimonial_Status") or "draft"
    ).strip().lower()
    testimonial_status = (
        "sent"
        if persisted_testimonial_status == "draft"
        and fields.get("Approval_Requested_At")
        else persisted_testimonial_status
    )
    if source_status == "uploaded" and testimonial_status == "draft":
        return "uploaded"
    if source_status == "analyzed" and testimonial_status in {
        "draft",
        "sent",
        "approved",
    }:
        return "analyzed" if testimonial_status == "draft" else testimonial_status
    return "invalid"


def _assert_valid_source_transition(existing_fields: dict, updates: dict) -> None:
    """Reject stale writes that skip or reverse the persisted lifecycle."""
    current_state = _source_lifecycle_state(existing_fields)
    next_state = _source_lifecycle_state({**existing_fields, **updates})
    allowed = {
        "uploaded": {"uploaded", "analyzed"},
        "analyzed": {"analyzed", "sent"},
        "sent": {"sent", "approved"},
        "approved": {"approved"},
    }
    if current_state in {"sent", "approved"} and "Source_Status" in updates:
        raise AirtableSourceConflictError(
            "Analyzed source content cannot change after approval is requested"
        )
    if current_state == "approved" and "Testimonial_Draft" in updates:
        raise AirtableSourceConflictError("Approved testimonial is immutable")
    if current_state == "approved" and "Approval_Requested_At" in updates:
        raise AirtableSourceConflictError("Approved source cannot be sent again")
    if current_state not in allowed or next_state not in allowed[current_state]:
        raise AirtableSourceConflictError(
            f"Invalid source transition from {current_state} to {next_state}"
        )


async def create_uploaded_source(
    *,
    source_id: str,
    business_name: str,
    owner_id: str,
    filename: str,
    file_type: str,
    transcript_text: str,
    word_count: int,
    share_id: str,
    created_at: str,
    blob_url: str = "",
) -> dict:
    """Strictly create the durable, owner-scoped Growth_Signals upload row."""
    if not _enabled():
        raise RuntimeError("Airtable source persistence is unavailable")
    owner_id = (owner_id or "").strip()
    if not owner_id:
        raise RuntimeError("A source owner is required")
    fields = {
        "Source_Id": source_id,
        "Business_Name": business_name,
        "Owner_Id": owner_id,
        # Growth_Signals already has Name, so it is reused for the filename.
        "Name": filename,
        "File_Type": file_type,
        "Transcript_Text": transcript_text,
        "Word_Count": word_count,
        "Source_Status": "uploaded",
        "Share_Id": share_id,
        "Created_At": created_at,
    }
    if blob_url:
        fields["Blob_Url"] = blob_url
    try:
        record = await _create(TABLE_GROWTH_SIGNALS, fields)
    except Exception as exc:
        logger.warning("Airtable uploaded-source create failed: %s", exc)
        raise RuntimeError("Airtable source persistence failed") from None
    if not isinstance(record, dict) or not record.get("id"):
        raise RuntimeError("Airtable source persistence failed")
    return record


async def get_source_by_id(
    source_id: str, business_name: str, *, owner_id: Optional[str] = None
) -> Optional[dict]:
    """Fetch one source within its required business and owner boundary.

    Legacy records with a blank Owner_Id intentionally remain shared inside the
    business. Every newly uploaded record has a nonblank owner and is private to
    that owner.
    """
    if not _enabled():
        raise AirtableSourceLookupError("Airtable source lookup is unavailable")
    owner_id = (owner_id or "").strip()
    if not owner_id:
        raise AirtableSourceLookupError("Airtable source owner scope is required")
    if not source_id or not business_name:
        return None
    try:
        data = await _get(
            TABLE_GROWTH_SIGNALS,
            {
                "filterByFormula": _source_scope_formula(
                    source_id, business_name, owner_id
                ),
                "maxRecords": 1,
            },
        )
    except Exception as exc:
        logger.warning("Airtable scoped source lookup failed: %s", exc)
        raise AirtableSourceLookupError("Airtable source lookup failed") from None
    records = data.get("records", []) if isinstance(data, dict) else []
    if not records:
        return None
    record = records[0]
    fields = record.get("fields", {})
    if (
        fields.get("Source_Id") != source_id
        or fields.get("Business_Name") != business_name
    ):
        return None
    if not _source_visible_to_owner(fields, owner_id):
        return None
    return record


async def update_source_by_id(
    source_id: str,
    business_name: str,
    fields: dict,
    *,
    owner_id: Optional[str] = None,
) -> Optional[dict]:
    """Strictly update an existing, tenant-scoped Growth_Signals row."""
    if not _enabled():
        raise AirtableSourceLookupError(
            "Airtable source persistence is unavailable"
        )
    owner_id = (owner_id or "").strip()
    if not owner_id:
        raise AirtableSourceLookupError("Airtable source owner scope is required")
    try:
        existing = await get_source_by_id(
            source_id, business_name, owner_id=owner_id
        )
    except AirtableSourceLookupError:
        raise
    except Exception as exc:
        logger.warning("Airtable scoped source lookup failed during update: %s", exc)
        raise AirtableSourceLookupError("Airtable source lookup failed") from None
    if not existing:
        return None
    _assert_valid_source_transition(existing.get("fields", {}), fields)
    try:
        updated = await _update(TABLE_GROWTH_SIGNALS, existing["id"], fields)
    except Exception as exc:
        logger.warning("Airtable scoped source update failed: %s", exc)
        raise AirtableSourcePersistenceError(
            "Airtable source persistence failed"
        ) from None
    if not isinstance(updated, dict) or not updated.get("id"):
        raise AirtableSourcePersistenceError("Airtable source persistence failed")
    return updated


async def upsert_growth_signal(source_id: str, business_name: str, insights: dict, testimonial_status: str, testimonial_draft: str = "", share_id: str = "") -> None:
    """Persist AI-extracted growth signals for a conversation to Airtable (create or update by Source_Id)."""
    if not _enabled():
        return
    fields = {
        "Name": f"{insights.get('company_name') or business_name} · {insights.get('call_type') or 'Demo'}",
        "Source_Id": source_id,
        "Business_Name": business_name,
        "Person": insights.get("speaker_name", ""),
        "Role": insights.get("speaker_role", ""),
        "Company": insights.get("company_name", ""),
        "Sentiment": insights.get("sentiment_label", ""),
        "Signal_Score": insights.get("signal_score", 0),
        "Call_Type": insights.get("call_type", ""),
        "Motivations": "\n".join(insights.get("motivations", [])),
        "Pain_Points": "\n".join(insights.get("pain_points", [])),
        "Buying_Signals": "\n".join(insights.get("buying_signals", [])),
        "Objections": "\n".join(insights.get("objections", [])),
        "Customer_Language": "\n".join(insights.get("customer_language", [])),
        "Product_Feedback": "\n".join(insights.get("product_feedback", [])),
        "FAQs": "\n".join(insights.get("faqs", [])),
        "Testimonial_Draft": testimonial_draft,
        "Share_Id": share_id,
        "Testimonial_Status": testimonial_status,
        "Created_At": datetime.now(timezone.utc).isoformat(),
    }
    try:
        formula = f'{{Source_Id}}="{_escape(source_id)}"'
        existing = await _get(TABLE_GROWTH_SIGNALS, {"filterByFormula": formula, "pageSize": 1})
        records = existing.get("records", [])
        if records:
            await _update(TABLE_GROWTH_SIGNALS, records[0]["id"], fields)
        else:
            await _create(TABLE_GROWTH_SIGNALS, fields)
    except Exception as e:
        logger.warning("Airtable growth-signal upsert failed: %s", e)



async def get_growth_signal_by_share_id(share_id: str) -> Optional[dict]:
    """Fetch a single Growth_Signals record by its public Share_Id (used by /public/testimonial/*)."""
    if not _enabled():
        raise AirtableSourceLookupError("Airtable source lookup is unavailable")
    if not share_id:
        return None
    try:
        formula = f'{{Share_Id}}="{_escape(share_id)}"'
        data = await _get(
            TABLE_GROWTH_SIGNALS,
            {"filterByFormula": formula, "maxRecords": 2},
        )
        records = data.get("records", [])
        if len(records) > 1:
            raise AirtableSourceCollisionError(
                "Airtable source Share_Id collision detected"
            )
        if not records:
            return None
        record = records[0]
        if record.get("fields", {}).get("Share_Id") != share_id:
            return None
        return record
    except AirtableSourceCollisionError:
        raise
    except Exception as e:
        logger.warning("Airtable growth signal lookup by share_id failed: %s", e)
        raise AirtableSourceLookupError("Airtable source lookup failed") from None


async def update_source_by_share_id(share_id: str, fields: dict) -> Optional[dict]:
    """Strictly update a public source through its persisted Share_Id."""
    if not _enabled():
        raise AirtableSourceLookupError(
            "Airtable source persistence is unavailable"
        )
    try:
        existing = await get_growth_signal_by_share_id(share_id)
    except AirtableSourceLookupError:
        raise
    except Exception as exc:
        logger.warning("Airtable public source lookup failed during update: %s", exc)
        raise AirtableSourceLookupError("Airtable source lookup failed") from None
    if not existing:
        return None
    existing_status = (
        existing.get("fields", {}).get("Testimonial_Status") or "draft"
    ).strip().lower()
    if existing_status == "approved":
        if "Testimonial_Draft" in fields:
            raise AirtableSourceConflictError("Approved testimonial is immutable")
        if (
            "Approved_Testimonial" in fields
            and not existing.get("fields", {}).get("Approved_Testimonial")
        ):
            proposed_snapshot = (fields.get("Approved_Testimonial") or "").strip()
            current_draft = (
                existing.get("fields", {}).get("Testimonial_Draft") or ""
            ).strip()
            if not proposed_snapshot or proposed_snapshot != current_draft:
                raise AirtableSourceConflictError(
                    "Legacy approval snapshot no longer matches its draft"
                )
        elif any(
            field in fields
            for field in ("Testimonial_Status", "Approved_Testimonial", "Approved_At")
        ):
            return existing
    _assert_valid_source_transition(existing.get("fields", {}), fields)
    try:
        updated = await _update(TABLE_GROWTH_SIGNALS, existing["id"], fields)
    except Exception as exc:
        logger.warning("Airtable public source update failed: %s", exc)
        raise AirtableSourcePersistenceError(
            "Airtable source persistence failed"
        ) from None
    if not isinstance(updated, dict) or not updated.get("id"):
        raise AirtableSourcePersistenceError("Airtable source persistence failed")
    return updated


async def update_growth_signal_by_source_id(source_id: str, fields: dict) -> bool:
    """Partial update of a Growth_Signals record located by Source_Id. Returns True if a record was updated."""
    try:
        formula = f'{{Source_Id}}="{_escape(source_id)}"'
        existing = await _get(TABLE_GROWTH_SIGNALS, {"filterByFormula": formula, "pageSize": 1})
        recs = existing.get("records", [])
        if recs:
            await _update(TABLE_GROWTH_SIGNALS, recs[0]["id"], fields)
            return True
    except Exception as e:
        logger.warning("Airtable growth-signal partial update failed: %s", e)
    return False


async def list_growth_signals_by_business(
    business_name: str, *, owner_id: Optional[str] = None
) -> list:
    """Return owner rows plus business-shared legacy rows from Airtable."""
    if not _enabled():
        raise AirtableSourceLookupError("Airtable source lookup is unavailable")
    owner_id = (owner_id or "").strip()
    if not owner_id:
        raise AirtableSourceLookupError("Airtable source owner scope is required")
    if not business_name:
        return []
    try:
        business_clause = f'{{Business_Name}}="{_escape(business_name)}"'
        formula = (
            f"AND({business_clause},"
            f'OR({{Owner_Id}}="{_escape(owner_id)}",{{Owner_Id}}=BLANK()))'
        )
        records = await _get_all(
            TABLE_GROWTH_SIGNALS,
            {"filterByFormula": formula, "pageSize": 100},
        )
        return [
            record
            for record in records
            if record.get("fields", {}).get("Business_Name") == business_name
            and _source_visible_to_owner(record.get("fields", {}), owner_id)
        ]
    except Exception as e:
        logger.warning("Airtable growth signals list failed: %s", e)
        raise AirtableSourceLookupError("Airtable source lookup failed") from None


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


async def update_circle_agent_plan(lead_id: str, plan: dict) -> None:
    """Save the agent's research findings and outreach drafts directly into the Airtable Circles record."""
    fields = {
        "Research_Headline": plan.get("research_headline") or "",
        "Research_Summary": "\n".join(plan.get("research_summary") or []),
        "Email_Subject": plan.get("email_subject") or "",
        "Email_Body": plan.get("email_body") or "",
        "Linkedin_Message": plan.get("linkedin_message") or "",
        "Next_Action_Label": plan.get("next_action", {}).get("label") or "",
        "Next_Action_Cta": plan.get("next_action", {}).get("cta") or "",
        "Agent_Plan_Status": plan.get("status") or "pending",
        "Agent_Plan_Generated_At": plan.get("generated_at") or "",
    }
    updated = await _update(TABLE_CIRCLES, lead_id, fields)
    if updated is None:
        raise RuntimeError("Airtable is not configured for agent plan persistence")
    logger.info("Saved agent plan to Airtable for lead %s", lead_id)


async def update_circle_agent_plan_status(lead_id: str, status: str) -> None:
    """Update only the agent plan status (approved/skipped) in the Airtable Circles record."""
    updated = await _update(TABLE_CIRCLES, lead_id, {"Agent_Plan_Status": status})
    if updated is None:
        raise RuntimeError("Airtable is not configured for agent plan persistence")
    logger.info("Updated agent plan status to %s in Airtable for lead %s", status, lead_id)


TABLE_BLOG_POSTS = "Blog_Posts"


def _record_to_blog_post(rec: dict) -> dict:
    f = rec.get("fields", {})
    return {
        "title": f.get("Title") or "",
        "slug": f.get("Slug") or "",
        "excerpt": f.get("Excerpt") or "",
        "content": f.get("Content") or "",
        "cover_image": f.get("Cover_Image") or None,
        "tag": f.get("Tag") or None,
        "author": f.get("Author") or "Uplaud Team",
        "published": bool(f.get("Published")),
        "created_at": f.get("Created_At") or rec.get("createdTime", "")
    }


async def list_blog_posts_airtable(limit: int = 50, published_only: bool = True) -> list:
    """Fetch blog posts from Airtable, optionally filtering by Published=1, sorted by Created_At/createdTime descending."""
    if limit <= 0:
        return []
    params = {"pageSize": min(limit, 100), "maxRecords": limit}
    if published_only:
        params["filterByFormula"] = "{Published}=1"
    try:
        records = await _get_all(TABLE_BLOG_POSTS, params)
        posts = [_record_to_blog_post(record) for record in records]
    except Exception as e:
        logger.warning("Airtable list_blog_posts failed: %s", e)
        return []
    posts.sort(key=lambda p: p["created_at"], reverse=True)
    return posts[:limit]


async def get_blog_post_airtable(slug: str) -> Optional[dict]:
    """Fetch a single blog post by Slug from Airtable."""
    try:
        formula = f'LOWER({{Slug}})="{_escape(slug.lower())}"'
        data = await _get(TABLE_BLOG_POSTS, {"filterByFormula": formula, "maxRecords": 1})
        records = data.get("records", [])
        if records:
            return _record_to_blog_post(records[0])
    except Exception as e:
        logger.warning("Airtable get_blog_post failed for slug %s: %s", slug, e)
    return None


async def create_blog_post_airtable(post: dict) -> Optional[dict]:
    """Create a new blog post in Airtable and return the created post."""
    fields = {
        "Title": post.get("title") or "",
        "Slug": post.get("slug") or "",
        "Excerpt": post.get("excerpt") or "",
        "Content": post.get("content") or "",
        "Cover_Image": post.get("cover_image") or "",
        "Tag": post.get("tag") or "",
        "Author": post.get("author") or "Uplaud Team",
        "Published": bool(post.get("published")),
        "Created_At": post.get("created_at") or datetime.now(timezone.utc).isoformat()
    }
    try:
        rec = await _create(TABLE_BLOG_POSTS, fields)
        return _record_to_blog_post(rec) if rec else None
    except Exception as e:
        logger.warning("Airtable create_blog_post failed: %s", e)
        return None


async def update_blog_post_airtable(slug: str, post: dict) -> Optional[dict]:
    """Update an existing blog post by its old Slug in Airtable and return the updated post."""
    try:
        formula = f'LOWER({{Slug}})="{_escape(slug.lower())}"'
        data = await _get(TABLE_BLOG_POSTS, {"filterByFormula": formula, "maxRecords": 1})
        records = data.get("records", [])
        if not records:
            return None
        record_id = records[0]["id"]
        fields = {
            "Title": post.get("title") or "",
            "Slug": post.get("slug") or "",
            "Excerpt": post.get("excerpt") or "",
            "Content": post.get("content") or "",
            "Cover_Image": post.get("cover_image") or "",
            "Tag": post.get("tag") or "",
            "Author": post.get("author") or "Uplaud Team",
            "Published": bool(post.get("published"))
        }
        rec = await _update(TABLE_BLOG_POSTS, record_id, fields)
        return _record_to_blog_post(rec) if rec else None
    except Exception as e:
        logger.warning("Airtable update_blog_post failed for slug %s: %s", slug, e)
        return None


async def delete_blog_post_airtable(slug: str) -> bool:
    """Delete a blog post by Slug in Airtable."""
    try:
        formula = f'LOWER({{Slug}})="{_escape(slug.lower())}"'
        data = await _get(TABLE_BLOG_POSTS, {"filterByFormula": formula, "maxRecords": 1})
        records = data.get("records", [])
        if not records:
            return False
        record_id = records[0]["id"]
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.delete(f"{AIRTABLE_API_URL}/{TABLE_BLOG_POSTS}/{record_id}", headers=_headers())
            r.raise_for_status()
            return True
    except Exception as e:
        logger.warning("Airtable delete_blog_post failed for slug %s: %s", slug, e)
        return False
