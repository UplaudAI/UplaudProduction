const PRODUCTION_ORIGIN = "https://www.uplaud.ai";

export function getPasswordResetRedirectUrl(currentHref = window.location.href) {
  const url = new URL(currentHref);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const origin = isLocal ? url.origin : PRODUCTION_ORIGIN;
  return `${origin}/business/reset-password`;
}

export async function requestPasswordReset(supabaseClient, email, currentHref = window.location.href) {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getPasswordResetRedirectUrl(currentHref),
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(supabaseClient, password) {
  const { error } = await supabaseClient.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}
