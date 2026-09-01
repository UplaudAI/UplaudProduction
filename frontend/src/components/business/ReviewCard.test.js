import { displayReviewSource } from "./ReviewCard";

describe("displayReviewSource", () => {
  test("uses the Airtable review source when present", () => {
    expect(displayReviewSource("Post Sales Testimonial")).toBe("Post Sales Testimonial");
  });

  test("falls back to WA when the review source is empty", () => {
    expect(displayReviewSource("")).toBe("WA");
    expect(displayReviewSource(null)).toBe("WA");
  });
});
