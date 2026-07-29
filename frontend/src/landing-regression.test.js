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

test("landing navbar stays transparent and uses a non-image wordmark", () => {
  const navbar = fs.readFileSync(
    path.join(__dirname, "components/landing/Navbar.jsx"),
    "utf8"
  );

  expect(navbar).toContain('data-testid="site-navbar"');
  expect(navbar).toContain("bg-transparent border-b border-transparent");
  expect(navbar).not.toContain("bg-white/85");
  expect(navbar).not.toContain("scrolled");
  expect(navbar).not.toContain("<img");
  expect(navbar).toContain('data-testid="brand-wordmark"');
  expect(navbar).toContain('data-testid="nav-sign-in-link"');
  expect(navbar).toContain("btn-secondary");
});

test("landing sections do not show deck-style numbered labels", () => {
  for (const file of [
    "components/landing/PainPoint.jsx",
    "components/landing/HowItWorks.jsx",
    "components/landing/Surfaces.jsx",
    "components/landing/Outcomes.jsx",
  ]) {
    const source = fs.readFileSync(path.join(__dirname, file), "utf8");
    expect(source).not.toContain("01 /");
    expect(source).not.toContain("02 /");
    expect(source).not.toContain("03 /");
    expect(source).not.toContain("04 /");
    expect(source).not.toContain("section-label");
  }
});

test("built for selector starts with B2B SaaS", () => {
  const hero = fs.readFileSync(
    path.join(__dirname, "components/landing/Hero.jsx"),
    "utf8"
  );

  expect(hero).toContain('const [activeVertical, setActiveVertical] = useState("b2b-saas")');
  expect(hero).toMatch(/id: "b2b-saas",\s+label: "B2B SaaS"/);
  expect(hero.indexOf('label: "B2B SaaS"')).toBeLessThan(
    hero.indexOf('label: "Education"')
  );
});
