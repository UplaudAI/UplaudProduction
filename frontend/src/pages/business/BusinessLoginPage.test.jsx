import fs from "fs";
import path from "path";


test("does not prefill the business login password", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "BusinessLoginPage.jsx"),
    "utf8"
  );

  expect(source).toMatch(
    /const \[password, setPassword\] = useState\(["']["']\);/
  );
});
