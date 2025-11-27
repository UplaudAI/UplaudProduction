// Sitemap Utility Functions
// Simple: Store new businesses, GitHub Actions appends them

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

const NEW_BUSINESSES_FILE = path.join(projectRoot, "src/utils/newBusinesses.json");
const SITEMAP_FILE = path.join(projectRoot, "public", "sitemap.xml");

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

/**
 * Store new business name to be added to sitemap later
 * GitHub Actions will read this and append to sitemap.xml
 */
export async function storeNewBusiness(businessName) {
  try {
    if (!businessName || typeof businessName !== 'string') {
      return { stored: false, reason: 'invalid-name' };
    }

    const trimmedName = businessName.trim();
    
    // Read existing new businesses
    let newBusinesses = [];
    if (fs.existsSync(NEW_BUSINESSES_FILE)) {
      try {
        const content = fs.readFileSync(NEW_BUSINESSES_FILE, "utf8");
        newBusinesses = JSON.parse(content).businesses || [];
      } catch (err) {
        console.warn("Could not parse newBusinesses.json, starting fresh");
      }
    }

    // Check if already queued
    if (newBusinesses.some(b => b.toLowerCase() === trimmedName.toLowerCase())) {
      console.log(`ℹ️ Business already queued: ${trimmedName}`);
      return { stored: false, reason: 'already-queued' };
    }

    // Add to queue
    newBusinesses.push(trimmedName);
    
    // Save queue
    fs.writeFileSync(
      NEW_BUSINESSES_FILE,
      JSON.stringify({ businesses: newBusinesses }, null, 2),
      "utf8"
    );

    console.log(`✅ Stored for sitemap: ${trimmedName}`);
    console.log(`📋 Total queued: ${newBusinesses.length}`);
    
    return { stored: true, businessName: trimmedName, queuedCount: newBusinesses.length };

  } catch (error) {
    console.error("❌ Error storing business:", error.message);
    return { stored: false, error: error.message };
  }
}

/**
 * Append new businesses to sitemap.xml
 * Called by GitHub Actions hourly
 */
export function appendToSitemap() {
  try {
    const BASE_URL = process.env.BASE_URL || "https://www.uplaud.ai";

    // Read new businesses queue
    if (!fs.existsSync(NEW_BUSINESSES_FILE)) {
      console.log("ℹ️ No new businesses to add");
      return { appended: 0 };
    }

    const newBusinessesData = JSON.parse(fs.readFileSync(NEW_BUSINESSES_FILE, "utf8"));
    const newBusinesses = newBusinessesData.businesses || [];

    if (newBusinesses.length === 0) {
      console.log("ℹ️ No new businesses to add");
      return { appended: 0 };
    }

    // Read current sitemap
    if (!fs.existsSync(SITEMAP_FILE)) {
      console.error("❌ Sitemap file not found!");
      return { appended: 0, error: "Sitemap file not found" };
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
    return { appended: addedCount };

  } catch (error) {
    console.error("❌ Error appending to sitemap:", error.message);
    return { appended: 0, error: error.message };
  }
}

export { slugify, SITEMAP_FILE };
