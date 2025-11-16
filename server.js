// server.js — Uplaud backend (ESM)
// Local dev:  node server.js
// Vercel:     /api/index.js imports and exports this app

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import axios from "axios";

dotenv.config();

/* ===================== Env & Constants ===================== */
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const REVIEWS_TABLE =
  process.env.AIRTABLE_REVIEWS_TABLE || process.env.REVIEWS_TABLE_ID;
const CIRCLES_TABLE =
  process.env.AIRTABLE_CIRCLES_TABLE || process.env.CIRCLES_TABLE_ID;
const USERS_TABLE =
  process.env.AIRTABLE_USERS_TABLE || process.env.USERS_TABLE_ID; // (not used here, just logged)

const app = express();

/* ===================== Middleware ===================== */
app.use(
  cors({
    origin: true,          // allow same-origin & any dev origin
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

console.log("Boot:", {
  PORT,
  AIRTABLE_API_KEY: API_KEY ? "SET (🔐)" : "MISSING",
  AIRTABLE_BASE_ID: BASE_ID || "MISSING",
  AIRTABLE_REVIEWS_TABLE: REVIEWS_TABLE || "MISSING",
  AIRTABLE_CIRCLES_TABLE: CIRCLES_TABLE || "MISSING",
  AIRTABLE_USERS_TABLE: USERS_TABLE || "(unused)",
});

if (!API_KEY || !BASE_ID || !REVIEWS_TABLE || !CIRCLES_TABLE) {
  console.warn(
    "⚠️  Missing Airtable env vars. Ensure AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_REVIEWS_TABLE, AIRTABLE_CIRCLES_TABLE are set."
  );
}

/* ===================== Utilities ===================== */
const slugify = (s = "") =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// Axios base headers for Airtable
const AT_HEADERS = API_KEY
  ? {
      Authorization: `Bearer ${API_KEY}`,
      "User-Agent": "uplaud-backend/1.0",
    }
  : {};

// Generic Airtable list with pagination (+ small retry on 429)
async function airtableList(tableId, params = {}) {
  if (!API_KEY) throw new Error("Missing AIRTABLE_API_KEY");
  if (!BASE_ID) throw new Error("Missing AIRTABLE_BASE_ID");
  if (!tableId) throw new Error("Missing Airtable table id");

  let records = [];
  let offset;

  // simple retry helper for rate limit
  const fetchPage = async (p) => {
    let attempt = 0;
    // up to 3 attempts on 429
    // (Airtable recommends exponential backoff)
    while (true) {
      try {
        const resp = await axios.get(
          `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
          {
            headers: AT_HEADERS,
            params: p,
            timeout: 20000,
          }
        );
        return resp;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 429 && attempt < 2) {
          const wait = 500 * Math.pow(2, attempt); // 500ms, 1000ms
          await new Promise((r) => setTimeout(r, wait));
          attempt++;
          continue;
        }
        throw err;
      }
    }
  };

  do {
    const resp = await fetchPage({
      pageSize: 100,
      ...params,
      ...(offset ? { offset } : {}),
    });
    const page = Array.isArray(resp.data?.records) ? resp.data.records : [];
    records = records.concat(page);
    offset = resp.data?.offset;
  } while (offset);

  return records;
}

// Formula that mirrors FE slugify: LOWER(REGEX_REPLACE(field, "[^A-Za-z0-9]+", "-"))
function slugMatchFormula(fieldName, slug) {
  const safeSlug = String(slug).toLowerCase().replace(/"/g, '\\"');
  return `LOWER(REGEX_REPLACE({${fieldName}},"[^A-Za-z0-9]+","-"))="${safeSlug}"`;
}

/* ===================== Health ===================== */
app.get("/", (_req, res) => res.send("✅ Uplaud Backend is running"));
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ===================== OTP (mock for dev) ===================== */
const otpStore = new Map();

app.post("/api/send-otp", (req, res) => {
  const { phone } = req.body || {};
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) {
    return res.status(400).json({ success: false, error: "Invalid phone number" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(digits, otp);
  console.log(`🔐 OTP for ${digits} is ${otp} (dev only — do not log in prod)`);
  return res.json({
    success: true,
    otp, // DEV ONLY — never return OTP in production
    message: "OTP generated successfully.",
  });
});

app.post("/api/verify-otp", (req, res) => {
  const { phone, otp } = req.body || {};
  const digits = String(phone || "").replace(/\D/g, "");
  const storedOtp = otpStore.get(digits);
  if (!storedOtp || storedOtp !== String(otp)) {
    return res.status(401).json({ success: false, error: "Invalid OTP" });
  }
  otpStore.delete(digits);
  return res.json({
    success: true,
    user: {
      phone: digits,
      userName: "John Doe", // mock user
      joinDate: new Date().toISOString(),
    },
  });
});

/* ===================== API: Reviews ===================== */
/**
 * GET /api/reviews?businessSlug=:slug[&debug=1]
 * Returns: { reviews: [{ user,uplaud,date,score,location,category,businessName }] }
 */
app.get("/api/reviews", async (req, res) => {
  try {
    const { businessSlug, debug } = req.query;
    if (!businessSlug) {
      return res.status(400).json({ error: "businessSlug required" });
    }
    const slug = String(businessSlug).toLowerCase();

    const fields = [
      "business_name",
      "Uplaud",
      "Uplaud Score",
      "Date_Added",
      "Name_Creator",
      "City",
      "Category",
    ];
    const filterByFormula = slugMatchFormula("business_name", slug);

    const records = await airtableList(REVIEWS_TABLE, {
      fields,
      filterByFormula,
    });

    const reviews = records
      .map((r) => r.fields || {})
      .filter((f) => f.business_name && f.Uplaud)
      .filter((f) => slugify(f.business_name) === slug)
      .map((f) => ({
        user:
          (Array.isArray(f["Name_Creator"])
            ? f["Name_Creator"][0]
            : f["Name_Creator"]) || "Anonymous",
        uplaud: f["Uplaud"] || "",
        date: f["Date_Added"] || null,
        score: typeof f["Uplaud Score"] === "number" ? f["Uplaud Score"] : null,
        location: f["City"] || "",
        category: f["Category"] || "",
        businessName: f["business_name"] || "",
      }));

    return res.json(debug ? { reviews, _debug: { filterByFormula } } : { reviews });
  } catch (err) {
    const details = err?.response?.data || err.message || String(err);
    console.error("GET /api/reviews error:", details);
    return res.status(500).json({
      error: "Failed to fetch reviews",
      hint:
        "Verify .env keys, table IDs, and field names (e.g., 'business_name', 'Uplaud', 'Uplaud Score'). Check server logs for details.",
    });
  }
});

/* ===================== API: Circles ===================== */
/**
 * GET /api/circles?businessSlug=:slug[&debug=1]
 *
 * We avoid UNKNOWN_FIELD_NAME by not passing a 'fields' array.
 * We also expose Airtable record.createdTime as Date_Added for the frontend.
 */
app.get("/api/circles", async (req, res) => {
  try {
    const { businessSlug, debug } = req.query;
    if (!businessSlug) {
      return res.status(400).json({ error: "businessSlug required" });
    }
    const slug = String(businessSlug).toLowerCase();
    const filterByFormula = slugMatchFormula("Business_Name", slug);

    const records = await airtableList(CIRCLES_TABLE, { filterByFormula });

    const circles = records
      .map((r) => ({ ...r.fields, _createdTime: r.createdTime }))
      .filter((f) => f["Business_Name"])
      .filter((f) => slugify(f["Business_Name"]) === slug)
      .map((f) => ({
        Initiator: f["Initiator"],
        Receiver: f["Receiver"],
        Business_Name: f["Business_Name"],
        Date_Added: f["_createdTime"] || null, // expose createdTime as Date_Added
        // If you add optional fields later, you can surface them safely:
        // ReferralStatus: f["ReferralStatus"] ?? null,
        // ReviewStatus: f["ReviewStatus"] ?? null,
      }));

    return res.json(
      debug ? { circles, _debug: { filterByFormula, count: circles.length } } : { circles }
    );
  } catch (err) {
    const details = err?.response?.data || err.message || String(err);
    console.error("GET /api/circles error:", details);
    return res.status(500).json({
      error: "Failed to fetch circles",
      hint:
        "We removed optional fields from the query. If errors persist, confirm 'Business_Name' exists in the Circles table.",
    });
  }
});

/* ===================== API: Dynamic Sitemap ===================== */
/**
 * GET /api/sitemap.xml
 * Dynamically generates sitemap from Airtable business names.
 * On Vercel, writing to the filesystem is not persistent, so we serve it dynamically.
 */
app.get("/api/sitemap.xml", async (req, res) => {
  try {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0];
    const SITE_URL = process.env.SITE_URL || (hostHeader ? `${proto}://${hostHeader}` : "https://uplaud-production.vercel.app");
    const fields = ["business_name"]; 
    const records = await airtableList(REVIEWS_TABLE, { fields });
    const slugs = Array.from(
      new Set(
        records
          .map((r) => r?.fields?.business_name || "")
          .filter(Boolean)
          .map((name) => slugify(name))
      )
    );

    const urls = slugs
      .map((slug) => `  <url>\n    <loc>${SITE_URL}/business/${slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`) 
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urls}\n` +
      `</urlset>`;

    res.set("Content-Type", "application/xml");
    // Reduce cache during validation: 60s; allow stale for 1 day
    res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (err) {
    const details = err?.response?.data || err.message || String(err);
    console.error("GET /api/sitemap.xml error:", details);
    return res.status(500).send("<error>Failed to build sitemap</error>");
  }
});

/* ===================== API: Airtable Webhook (no-op) ===================== */
/**
 * POST /api/airtable-webhook
 * Kept for compatibility; sitemap is now dynamic and does not write to disk.
 */
app.post("/api/airtable-webhook", (req, res) => {
  try {
    const businessName = req?.body?.businessName || null;
    console.log("📬 Webhook received", { businessName });
    return res.json({ ok: true, message: "Webhook received. Sitemap is generated dynamically." });
  } catch (err) {
    return res.status(500).json({ error: "Webhook error" });
  }
});

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

/* ===================== Export & Local Start ===================== */
// Export the Express app for Vercel serverless
export default app;

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
