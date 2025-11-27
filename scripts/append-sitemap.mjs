#!/usr/bin/env node
/**
 * Append queued businesses to sitemap.xml
 * Run by GitHub Actions every hour
 */

import { appendToSitemap } from "../src/utils/sitemapUtils.js";

const result = appendToSitemap();

if (result.appended > 0) {
  console.log(`✅ Added ${result.appended} businesses to sitemap`);
  process.exit(0);
} else if (result.error) {
  console.error(`❌ Error: ${result.error}`);
  process.exit(1);
} else {
  console.log("ℹ️ No new businesses to add");
  process.exit(0);
}
