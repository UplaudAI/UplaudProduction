// AI Context API - Returns business reviews in AI-readable format
// This endpoint is designed for AI tools like ChatGPT, Claude, Perplexity, etc.
// to fetch and display Uplaud reviews

import axios from "axios";

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const REVIEWS_TABLE =
  process.env.AIRTABLE_REVIEWS_TABLE || process.env.REVIEWS_TABLE_ID;

const AT_HEADERS = API_KEY
  ? {
      Authorization: `Bearer ${API_KEY}`,
      "User-Agent": "uplaud-ai-context/1.0",
    }
  : {};

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function airtableList(tableId, params = {}) {
  if (!API_KEY || !BASE_ID || !tableId) {
    throw new Error("Missing Airtable configuration");
  }

  let records = [];
  let offset;

  do {
    const resp = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
      {
        headers: AT_HEADERS,
        params: {
          pageSize: 100,
          ...params,
          ...(offset ? { offset } : {}),
        },
        timeout: 20000,
      }
    );
    const page = Array.isArray(resp.data?.records) ? resp.data.records : [];
    records = records.concat(page);
    offset = resp.data?.offset;
  } while (offset);

  return records;
}

function slugMatchFormula(fieldName, slug) {
  const safeSlug = String(slug).toLowerCase().replace(/"/g, '\\"');
  return `LOWER(REGEX_REPLACE({${fieldName}},"[^A-Za-z0-9]+","-"))="${safeSlug}"`;
}

export default async function handler(req, res) {
  try {
    const { business, format = "text" } = req.query;

    // If no business specified, return information about available data
    if (!business) {
      return res.status(200).json({
        service: "Uplaud AI Context API",
        description:
          "This endpoint provides AI-readable access to Uplaud reviews for businesses.",
        usage: {
          endpoint: "/api/ai-context",
          parameters: {
            business: "Business name or slug (required)",
            format: "'text' or 'json' (optional, default: text)",
          },
          examples: [
            "/api/ai-context?business=cold-stone",
            "/api/ai-context?business=ayurneeds&format=json",
            "/api/ai-context?business=meghanas-food&format=text",
          ],
        },
        note: "This endpoint is optimized for AI tools like ChatGPT, Claude, and Perplexity to fetch and display customer reviews.",
      });
    }

    // Convert business name to slug
    const slug = slugify(business);

    // Fetch reviews from Airtable
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
        reviewer:
          (Array.isArray(f["Name_Creator"])
            ? f["Name_Creator"][0]
            : f["Name_Creator"]) || "Anonymous",
        review: f["Uplaud"] || "",
        date: f["Date_Added"] || null,
        score: typeof f["Uplaud Score"] === "number" ? f["Uplaud Score"] : null,
        location: f["City"] || "",
        category: f["Category"] || "",
        businessName: f["business_name"] || "",
      }));

    if (reviews.length === 0) {
      return res.status(404).json({
        error: "No reviews found",
        message: `No reviews found for business: ${business}`,
        suggestion:
          "Try searching with the exact business name as it appears on Uplaud",
      });
    }

    const businessName = reviews[0].businessName;
    const category = reviews[0].category;
    const location = reviews[0].location;

    // Return as human-readable text (optimized for AI consumption)
    if (format === "text") {
      const totalReviews = reviews.length;
      const avgScore =
        reviews.reduce((sum, r) => sum + (r.score || 0), 0) / totalReviews;

      let textOutput = `# ${businessName} - Uplaud Reviews\n\n`;
      textOutput += `**Category:** ${category || "Not specified"}\n`;
      textOutput += `**Location:** ${location || "Not specified"}\n`;
      textOutput += `**Total Reviews:** ${totalReviews}\n`;
      textOutput += `**Average Score:** ${avgScore.toFixed(1)}/5 ⭐\n\n`;
      textOutput += `---\n\n`;
      textOutput += `## Customer Reviews:\n\n`;

      reviews.forEach((review, index) => {
        textOutput += `### Review #${index + 1}\n`;
        textOutput += `**By:** ${review.reviewer}\n`;
        if (review.score) {
          textOutput += `**Rating:** ${"⭐".repeat(review.score)} (${review.score}/5)\n`;
        }
        if (review.date) {
          textOutput += `**Date:** ${new Date(review.date).toLocaleDateString()}\n`;
        }
        textOutput += `\n"${review.review}"\n\n`;
        textOutput += `---\n\n`;
      });

      textOutput += `\n*Source: Uplaud.ai - Authentic customer reviews*\n`;
      textOutput += `*View full profile: https://www.uplaud.ai/business/${slug}*\n`;

      return res.status(200).send(textOutput);
    }

    // Return as JSON (for programmatic access)
    return res.status(200).json({
      business: {
        name: businessName,
        slug: slug,
        category: category || null,
        location: location || null,
        url: `https://www.uplaud.ai/business/${slug}`,
      },
      summary: {
        totalReviews: reviews.length,
        averageScore:
          reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length,
        latestReviewDate: reviews[0]?.date || null,
      },
      reviews: reviews.map((r) => ({
        reviewer: r.reviewer,
        review: r.review,
        score: r.score,
        date: r.date,
        location: r.location,
      })),
      meta: {
        source: "Uplaud.ai",
        fetchedAt: new Date().toISOString(),
        apiVersion: "1.0",
      },
    });
  } catch (error) {
    console.error("AI Context API error:", error);
    return res.status(500).json({
      error: "Failed to fetch reviews",
      message: error.message,
      hint: "Please check business name and try again",
    });
  }
}
