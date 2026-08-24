import { getAuthErrorMessage } from "./auth-error-message";

describe("getAuthErrorMessage", () => {
  test("formats password reset rate limits as password reset requests", () => {
    expect(getAuthErrorMessage("rate limit exceeded", "password-reset")).toBe(
      "Too many password reset requests. Please wait a few minutes before trying again."
    );
  });

  test("keeps registration rate limits specific to registration", () => {
    expect(getAuthErrorMessage("rate limit exceeded", "signup")).toBe(
      "Too many registration requests. Please wait a few minutes before trying again."
    );
  });
});
