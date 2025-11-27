// Backfill Script: Add all existing businesses from Airtable to sitemap
// Run this ONCE after deploying webhook automation
// This ensures existing reviews are in the sitemap too

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../");

const SITEMAP_FILE = path.join(projectRoot, "public", "sitemap.xml");
const BASE_URL = process.env.BASE_URL || "https://www.uplaud.ai";

// Airtable configuration
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const REVIEWS_TABLE = process.env.AIRTABLE_REVIEWS_TABLE || process.env.REVIEWS_TABLE_ID;

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function fetchAllBusinessNames() {
  console.log("📡 Fetching all businesses from Airtable...");
  
  let allRecords = [];
  let offset = null;

  do {
    const params = {
      fields: ["business_name"],
      pageSize: 100,
    };
    if (offset) params.offset = offset;

    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params,
      }
    );

    allRecords = allRecords.concat(response.data.records);
    offset = response.data.offset;
    
    console.log(`  Fetched ${allRecords.length} records so far...`);
  } while (offset);

  // Extract unique business names
  const businessNames = [...new Set(
    allRecords
      .map((r) => r.fields?.business_name)
      .filter((name) => name && name.trim())
  )];

  console.log(`✅ Found ${businessNames.length} unique businesses\n`);
  return businessNames;
}

function addBusinessesToSitemap(businessNames) {
  console.log("📝 Adding businesses to sitemap...\n");

  // Read current sitemap
  let sitemapContent = fs.readFileSync(SITEMAP_FILE, "utf8");
  const today = new Date().toISOString().split("T")[0];

  let addedCount = 0;
  let skippedCount = 0;
  const addedBusinesses = [];

  for (const businessName of businessNames) {
    const slug = slugify(businessName);
    const businessUrl = `${BASE_URL}/business/${slug}`;

    // Check if already exists
    if (sitemapContent.includes(`<loc>${businessUrl}</loc>`)) {
      console.log(`  ⏭️  Skipping (exists): ${businessName}`);
      skippedCount++;
      continue;
    }

    // Create new URL entry
    const newUrlEntry = `  <url>
    <loc>${businessUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Find closing tag and insert
    const closingTag = "</urlset>";
    const closingTagIndex = sitemapContent.lastIndexOf(closingTag);

    sitemapContent =
      sitemapContent.slice(0, closingTagIndex) +
      newUrlEntry +
      "\n" +
      sitemapContent.slice(closingTagIndex);

    console.log(`  ✅ Added: ${businessName} → ${businessUrl}`);
    addedCount++;
    addedBusinesses.push(businessName);
  }

  // Write updated sitemap
  fs.writeFileSync(SITEMAP_FILE, sitemapContent, "utf8");

  console.log("\n" + "=".repeat(60));
  console.log("📊 BACKFILL COMPLETE!");
  console.log("=".repeat(60));
  console.log(`✅ Added: ${addedCount} businesses`);
  console.log(`⏭️  Skipped: ${skippedCount} (already in sitemap)`);
  console.log(`📄 Sitemap file: ${SITEMAP_FILE}`);
  console.log("=".repeat(60));

  if (addedBusinesses.length > 0) {
    console.log("\n📋 Newly added businesses:");
    addedBusinesses.slice(0, 10).forEach((name) => console.log(`  - ${name}`));
    if (addedBusinesses.length > 10) {
      console.log(`  ... and ${addedBusinesses.length - 10} more`);
    }
  }
}

// Main execution
async function main() {
  console.log("\n🚀 Starting Sitemap Backfill Process\n");
  console.log("This will add ALL existing businesses from Airtable to sitemap.xml");
  console.log("New reviews will be handled automatically by webhook going forward.\n");

  // Validation
  if (!API_KEY || !BASE_ID || !REVIEWS_TABLE) {
    console.error("❌ Missing environment variables!");
    console.error("Required: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_REVIEWS_TABLE");
    process.exit(1);
  }

  if (!fs.existsSync(SITEMAP_FILE)) {
    console.error(`❌ Sitemap file not found: ${SITEMAP_FILE}`);
    process.exit(1);
  }

  try {
    // Step 1: Fetch all businesses from Airtable
    const businessNames = await fetchAllBusinessNames();

    // Step 2: Add them to sitemap
    addBusinessesToSitemap(businessNames);

    console.log("\n✅ Backfill complete! Your sitemap is now up to date.");
    console.log("💡 Future reviews will be added automatically via webhook.\n");
  } catch (error) {
    console.error("\n❌ Backfill failed:", error.message);
    process.exit(1);
  }
}

main();
