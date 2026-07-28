import fs from "fs";
import path from "path";

test("viewing an approval page first marks the source as awaiting approval", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "ConversationsPage.jsx"),
    "utf8"
  );

  expect(source).toContain("openApprovalPage");
  expect(source).toContain('api.post(`/sources/${c._sourceId}/send-approval`)');
  expect(source).not.toContain('href={`/t/${c.shareId}`}');
});
