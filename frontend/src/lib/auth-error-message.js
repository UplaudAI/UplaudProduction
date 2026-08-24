export function getAuthErrorMessage(error, context = "login") {
  if (!error) {
    return "";
  }

  const message = String(error);
  if (!message.toLowerCase().includes("rate limit")) {
    return message;
  }

  if (context === "password-reset") {
    return "Too many password reset requests. Please wait a few minutes before trying again.";
  }

  if (context === "signup") {
    return "Too many registration requests. Please wait a few minutes before trying again.";
  }

  return "Too many requests. Please wait a few minutes before trying again.";
}
