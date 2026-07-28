import fs from "fs";
import path from "path";

test("public testimonial approval controls only render for sent testimonials", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "TestimonialPage.jsx"),
    "utf8"
  );

  expect(source).toContain('const awaitingApproval = data?.status === "sent";');
  expect(source).toContain("{awaitingApproval && (");
  expect(source).not.toContain("{!approved && (");
});
