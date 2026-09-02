/**
 * Client-safe auth form validation + error copy (Account ≠ Membership).
 */

export const AUTH_PASSWORD_MISMATCH = "Las contraseñas no coinciden";
export const AUTH_EMAIL_INVALID = "Introduce un email válido";
export const AUTH_PASSWORD_WEAK = "Usa una contraseña más segura";
export const AUTH_EMAIL_EXISTS = "Esta cuenta ya existe. Inicia sesión.";
export const AUTH_REGISTER_GENERIC =
  "No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.";
export const AUTH_LOGIN_GENERIC =
  "No pudimos iniciar sesión. Revisa email y contraseña.";
export const AUTH_NETWORK = "Error de red. Inténtalo de nuevo.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAuthEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= 8;
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

/** Map API / provider errors to clear Spanish UX copy. */
export function mapRegisterError(error?: string | null): string {
  if (!error) return AUTH_REGISTER_GENERIC;
  if (error === "auth_not_configured") {
    return "El registro aún no está disponible. Prueba unirte desde Perfil.";
  }
  if (error === "invalid_credentials") {
    return AUTH_PASSWORD_WEAK;
  }
  const lower = error.toLowerCase();
  if (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("exists") ||
    lower.includes("user_already")
  ) {
    return AUTH_EMAIL_EXISTS;
  }
  if (lower.includes("password") && lower.includes("weak")) {
    return AUTH_PASSWORD_WEAK;
  }
  if (lower.includes("email") && (lower.includes("invalid") || lower.includes("valid"))) {
    return AUTH_EMAIL_INVALID;
  }
  return AUTH_REGISTER_GENERIC;
}

export function mapLoginError(error?: string | null): string {
  if (!error) return AUTH_LOGIN_GENERIC;
  if (error === "auth_not_configured") {
    return "El acceso aún no está disponible. Prueba unirte desde Perfil.";
  }
  return AUTH_LOGIN_GENERIC;
}
