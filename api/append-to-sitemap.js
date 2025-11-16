// api/append-to-sitemap.js
// Appends a new business to public/sitemap.xml via GitHub API and triggers Vercel redeploy

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { businessName } = req.body || {};
  if (!businessName) {
    return res.status(400).json({ error: "businessName required" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO || "UplaudAI/UplaudProduction";
  const FILE_PATH = "public/sitemap.xml";
  const SITE_URL = process.env.SITE_URL || "https://uplaud-production.vercel.app";

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GITHUB_TOKEN not configured" });
  }

  try {
    const slug = String(businessName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // 1. Fetch current sitemap.xml from GitHub
    const getUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const getResp = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!getResp.ok) {
      const txt = await getResp.text();
      return res.status(500).json({ error: "Failed to fetch sitemap from GitHub", details: txt });
    }

    const fileData = await getResp.json();
    const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");
    const sha = fileData.sha;

    // 2. Check if slug already exists
    if (currentContent.includes(`/business/${slug}</loc>`)) {
      return res.json({ ok: true, message: "Business already in sitemap", slug });
    }

    // 3. Append new <url> entry before </urlset>
    const newEntry = `  <url>\n    <loc>${SITE_URL}/business/${slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`;
    const updatedContent = currentContent.replace("</urlset>", newEntry);

    // 4. Commit updated sitemap.xml back to GitHub
    const putUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const putResp = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore: add ${businessName} to sitemap`,
        content: Buffer.from(updatedContent, "utf-8").toString("base64"),
        sha,
      }),
    });

    if (!putResp.ok) {
      const txt = await putResp.text();
      return res.status(500).json({ error: "Failed to commit sitemap to GitHub", details: txt });
    }

    const commitData = await putResp.json();
    console.log(`✅ Appended ${businessName} (${slug}) to sitemap.xml`, commitData.commit.sha);

    return res.json({
      ok: true,
      message: "Business appended to sitemap; Vercel will auto-deploy",
      slug,
      commit: commitData.commit.html_url,
    });
  } catch (err) {
    console.error("append-to-sitemap error:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
