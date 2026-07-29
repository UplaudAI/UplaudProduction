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

test("landing navbar is transparent at top and protected on scroll", () => {
  const navbar = fs.readFileSync(
    path.join(__dirname, "components/landing/Navbar.jsx"),
    "utf8"
  );

  expect(navbar).toContain('data-testid="site-navbar"');
  expect(navbar).toContain("bg-transparent border-b border-transparent");
  expect(navbar).toContain("setScrolled(window.scrollY > 12)");
  expect(navbar).toContain("backdrop-blur-xl bg-white/90");
  expect(navbar).toContain("shadow-[0_16px_40px_-32px_rgba(38,28,77,0.55)]");
  expect(navbar).not.toContain("bg-white/85");
  expect(navbar).toContain("h-14 flex items-center justify-between");
  expect(navbar).not.toContain("h-16 flex items-center justify-between");
});

test("landing navbar uses the transparent logo asset", () => {
  const navbar = fs.readFileSync(
    path.join(__dirname, "components/landing/Navbar.jsx"),
    "utf8"
  );

  expect(navbar).toContain("<img");
  expect(navbar).toContain('src="/assets/uplaud-logo-purple-transparent.png"');
  expect(navbar).toContain("h-11");
  expect(navbar).toContain("maxWidth: 140");
  expect(navbar).not.toContain("logo_white_background");
  expect(navbar).toContain('data-testid="nav-sign-in-link"');
});

test("landing navbar CTAs use modern non-pill button shapes", () => {
  const navbar = fs.readFileSync(
    path.join(__dirname, "components/landing/Navbar.jsx"),
    "utf8"
  );

  expect(navbar).toContain("h-9");
  expect(navbar).toContain("rounded-xl");
  expect(navbar).toContain("shadow-[0_10px_24px_-16px_rgba(109,70,198,0.75)]");
  expect(navbar).not.toContain("h-11 items-center justify-center rounded-2xl");
  expect(navbar).not.toContain('className="btn-secondary h-11 px-5"');
  expect(navbar).not.toContain('className="btn-primary h-11 px-5"');
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

test("built for selector starts with SaaS while keeping the SaaS mock content intact", () => {
  const hero = fs.readFileSync(
    path.join(__dirname, "components/landing/Hero.jsx"),
    "utf8"
  );

  expect(hero).toContain('const [activeVertical, setActiveVertical] = useState("b2b-saas")');
  expect(hero).toMatch(/id: "b2b-saas",\s+label: "SaaS"/);
  expect(hero).toContain("Best onboarding platform for B2B SaaS?");
  expect(hero.indexOf('label: "SaaS"')).toBeLessThan(
    hero.indexOf('label: "Education"')
  );
});
