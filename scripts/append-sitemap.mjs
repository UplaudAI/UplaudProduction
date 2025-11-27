#!/usr/bin/env node
/**
 * Append queued businesses to sitemap.xml
 * Run by GitHub Actions every hour
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../");

const NEW_BUSINESSES_FILE = path.join(projectRoot, "src/utils/newBusinesses.json");
const SITEMAP_FILE = path.join(projectRoot, "public", "sitemap.xml");

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

try {
  const BASE_URL = process.env.BASE_URL || "https://www.uplaud.ai";

  // Read new businesses queue
  if (!fs.existsSync(NEW_BUSINESSES_FILE)) {
    console.log("ℹ️ No new businesses queue file found");
    process.exit(0);
  }

  const newBusinessesData = JSON.parse(fs.readFileSync(NEW_BUSINESSES_FILE, "utf8"));
  const newBusinesses = newBusinessesData.businesses || [];

  if (newBusinesses.length === 0) {
    console.log("ℹ️ No new businesses to add");
    process.exit(0);
  }

  // Read current sitemap
  if (!fs.existsSync(SITEMAP_FILE)) {
    console.error("❌ Sitemap file not found!");
    process.exit(1);
  }

  let sitemapContent = fs.readFileSync(SITEMAP_FILE, "utf8");
  const today = new Date().toISOString().split("T")[0];

  let addedCount = 0;

  // Append each new business
  for (const businessName of newBusinesses) {
    const slug = slugify(businessName);
    const businessUrl = `${BASE_URL}/business/${slug}`;

    // Check if already in sitemap
    if (sitemapContent.includes(`<loc>${businessUrl}</loc>`)) {
      console.log(`ℹ️ Already in sitemap: ${businessName}`);
      continue;
    }

    // Create entry
    const entry = `  <url>
    <loc>${businessUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Append before closing tag
    const closingTag = "</urlset>";
    const closingIndex = sitemapContent.lastIndexOf(closingTag);
    
    if (closingIndex !== -1) {
      sitemapContent = 
        sitemapContent.slice(0, closingIndex) +
        entry +
        sitemapContent.slice(closingIndex);
      addedCount++;
      console.log(`✅ Added: ${businessName}`);
    }
  }

  // Write updated sitemap
  fs.writeFileSync(SITEMAP_FILE, sitemapContent, "utf8");

  // Clear the queue
  fs.writeFileSync(NEW_BUSINESSES_FILE, JSON.stringify({ businesses: [] }, null, 2), "utf8");

  console.log(`✅ Appended ${addedCount} businesses to sitemap`);
  process.exit(0);

} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
