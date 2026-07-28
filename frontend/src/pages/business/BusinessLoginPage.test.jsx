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
