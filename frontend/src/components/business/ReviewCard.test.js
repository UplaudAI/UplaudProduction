jest.mock("react-router-dom", () => ({
  Link: ({ children }) => children,
}), { virtual: true });

import { displayReviewSource, normalizeReviewRating, reviewerProfilePath } from "./ReviewCard";

describe("displayReviewSource", () => {
  test("uses the Airtable review source when present", () => {
    expect(displayReviewSource("Post Sales Testimonial")).toBe("Post Sales Testimonial");
  });

  test("falls back to WA when the review source is empty", () => {
    expect(displayReviewSource("")).toBe("WA");
    expect(displayReviewSource(null)).toBe("WA");
  });
});

describe("normalizeReviewRating", () => {
  test("uses the Airtable Uplaud Score instead of forcing five stars", () => {
    expect(normalizeReviewRating(4)).toBe(4);
    expect(normalizeReviewRating("3")).toBe(3);
  });

  test("falls back to five stars when the score is missing", () => {
    expect(normalizeReviewRating(null)).toBe(5);
    expect(normalizeReviewRating(undefined)).toBe(5);
  });
});

describe("reviewerProfilePath", () => {
  test("links reviewer names into the business-scoped public reviewer page", () => {
    expect(reviewerProfilePath({ business_slug: "aifiesta", reviewer_slug: "priya-menon" })).toBe(
      "/business/public/aifiesta/reviewer/priya-menon"
    );
  });
});
