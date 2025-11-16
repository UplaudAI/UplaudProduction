// Sitemap Utility Functions
// These help add businesses to sitemap without regenerating the entire file

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

const SITEMAP_FILE = path.join(projectRoot, "public", "sitemap.xml");
const BASE_URL = process.env.BASE_URL || "https://www.uplaud.ai";

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

/**
 * Add a single business to sitemap (incremental update)
 * @param {string} businessName - Name of the business to add
 * @returns {Object} - { added: boolean, urlsAdded: number }
 */
export async function addBusinessToSitemap(businessName) {
  try {
    if (!businessName || typeof businessName !== 'string') {
      return { added: false, reason: 'invalid-name' };
    }

    const slug = slugify(businessName.trim());
    if (!slug) {
      return { added: false, reason: 'empty-slug' };
    }

    const today = new Date().toISOString().split("T")[0];
    const businessUrl = `${BASE_URL}/business/${slug}`;

    // Ensure sitemap exists
    if (!fs.existsSync(SITEMAP_FILE)) {
      console.log("📄 Creating new sitemap.xml file...");
      createBaseSitemap();
    }

    // Read current sitemap
    const sitemapContent = fs.readFileSync(SITEMAP_FILE, "utf8");

    // Check if business URL already exists
    if (sitemapContent.includes(`<loc>${businessUrl}</loc>`)) {
      console.log(`ℹ️ URL already exists: ${businessUrl}`);
      return { added: false, reason: 'already-exists' };
    }

    // Create new URL entry
    const newUrlEntry = `  <url>
    <loc>${businessUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Find the closing </urlset> tag and insert before it
    const closingTag = "</urlset>";
    const closingTagIndex = sitemapContent.lastIndexOf(closingTag);

    if (closingTagIndex === -1) {
      console.error("❌ Invalid sitemap format - missing </urlset>");
      return { added: false, reason: 'invalid-format' };
    }

    // Insert new entry before closing tag
    const updatedSitemap = 
      sitemapContent.slice(0, closingTagIndex) +
      newUrlEntry + "\n" +
      sitemapContent.slice(closingTagIndex);

    // Write updated sitemap
    fs.writeFileSync(SITEMAP_FILE, updatedSitemap, "utf8");

    console.log(`✅ Added to sitemap: ${businessUrl}`);
    return { added: true, urlsAdded: 1, url: businessUrl };

  } catch (error) {
    console.error("❌ Error adding business to sitemap:", error);
    return { added: false, error: error.message };
  }
}

/**
 * Create a base sitemap.xml file if it doesn't exist
 */
function createBaseSitemap() {
  const baseDir = path.dirname(SITEMAP_FILE);
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const today = new Date().toISOString().split("T")[0];

  const baseSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/leaderboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/privacy-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/terms-of-service</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, baseSitemap, "utf8");
  console.log("✅ Created base sitemap.xml");
}

/**
 * Check if a business exists in the sitemap
 * @param {string} businessName - Name of the business
 * @returns {boolean}
 */
export function isBusinessInSitemap(businessName) {
  try {
    if (!fs.existsSync(SITEMAP_FILE)) {
      return false;
    }

    const slug = slugify(businessName.trim());
    const businessUrl = `${BASE_URL}/business/${slug}`;
    const sitemapContent = fs.readFileSync(SITEMAP_FILE, "utf8");

    return sitemapContent.includes(`<loc>${businessUrl}</loc>`);
  } catch (error) {
    console.error("Error checking sitemap:", error);
    return false;
  }
}

export { slugify, SITEMAP_FILE, BASE_URL };
