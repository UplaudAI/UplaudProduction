import fs from "fs";
import path from "path";


test("does not prefill business login credentials", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "BusinessLoginPage.jsx"),
    "utf8"
  );

  expect(source).toMatch(
    /const \[email, setEmail\] = useState\(["']["']\);/
  );
  expect(source).toMatch(
    /const \[password, setPassword\] = useState\(["']["']\);/
  );
});

test("uses Vercel-safe session API routes for business login", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "BusinessLoginPage.jsx"),
    "utf8"
  );

  expect(source).toContain('api.post("/session/login"');
  expect(source).toContain('api.get("/session/me"');
  expect(source).not.toContain('api.post("/auth/login"');
  expect(source).not.toContain('api.get("/auth/me"');
});
