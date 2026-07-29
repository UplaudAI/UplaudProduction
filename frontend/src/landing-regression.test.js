import fs from "fs";
import path from "path";

test("production document title is Uplaud.AI", () => {
  const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");

  expect(html).toContain("<title>Uplaud.AI</title>");
  expect(html).not.toContain("Emergent | Fullstack App");
  expect(html).not.toContain("Emergent Full Stack App");
});

test("book demo form posts to a real backend leads endpoint", () => {
  const leadForm = fs.readFileSync(
    path.join(__dirname, "components/landing/LeadForm.jsx"),
    "utf8"
  );
  const server = fs.readFileSync(
    path.join(__dirname, "../../backend/server.py"),
    "utf8"
  );

  expect(leadForm).toContain('api.post("/leads"');
  expect(server).toContain('@api_router.post("/leads")');
  expect(server).toContain("deepthi@uplaud.ai");
});

test("book demo success message does not expose the recipient email address", () => {
  const leadForm = fs.readFileSync(
    path.join(__dirname, "components/landing/LeadForm.jsx"),
    "utf8"
  );
  const successMessage = leadForm.slice(
    leadForm.indexOf('data-testid="lead-form-success"'),
    leadForm.indexOf(") : (", leadForm.indexOf('data-testid="lead-form-success"'))
  );

  expect(successMessage).toContain("Your request was captured.");
  expect(successMessage).not.toContain("mailto:");
  expect(successMessage).not.toContain("deepthi@uplaud.ai");
});

test("business login hero highlights the full Every Interaction phrase", () => {
  const login = fs.readFileSync(
    path.join(__dirname, "pages/business/BusinessLoginPage.jsx"),
    "utf8"
  );
  const css = fs.readFileSync(path.join(__dirname, "index.css"), "utf8");

  expect(login).toContain(
    '<span className="mint-highlight text-[#261c4d]">Every Interaction</span>'
  );
  expect(login).not.toContain("mint-underline text-[#261c4d]\">Every interaction");
  expect(css).toContain(".mint-highlight");
  expect(css).toContain("box-decoration-break: clone");
});
