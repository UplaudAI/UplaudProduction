import fs from "fs";
import path from "path";

test("data sources metrics do not use demo fallback counts", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "ImportReviewsPage.jsx"),
    "utf8"
  );

  expect(source).toContain("const signalsSyncedValue = totalSignals;");
  expect(source).toContain("const interactionsCount = totalInteractions;");
  expect(source).toContain("const reviewsCount = 0;");

  expect(source).not.toContain("totalSources * 28 + 15");
  expect(source).not.toContain("totalInteractions || totalSources");
  expect(source).not.toContain("totalSources * 3");
});
