import {
  getPasswordResetRedirectUrl,
  requestPasswordReset,
  updatePassword,
} from "./password-reset";

describe("password reset helpers", () => {
  test("uses the canonical production host when running on a Vercel deployment URL", () => {
    const redirectUrl = getPasswordResetRedirectUrl(
      "https://uplaud-production-deepthi-uplaudais-projects.vercel.app/business"
    );

    expect(redirectUrl).toBe("https://www.uplaud.ai/business/reset-password");
  });

  test("uses the current local origin during development", () => {
    const redirectUrl = getPasswordResetRedirectUrl("http://localhost:3000/business");

    expect(redirectUrl).toBe("http://localhost:3000/business/reset-password");
  });

  test("requests a Supabase recovery email for the normalized email", async () => {
    const resetPasswordForEmail = jest.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { resetPasswordForEmail } };

    await requestPasswordReset(supabase, "  USER@Example.COM  ", "https://www.uplaud.ai/business");

    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://www.uplaud.ai/business/reset-password",
    });
  });

  test("updates the Supabase user password", async () => {
    const updateUser = jest.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { updateUser } };

    await updatePassword(supabase, "new-password-123");

    expect(updateUser).toHaveBeenCalledWith({ password: "new-password-123" });
  });
});
