/** Minimal client-side JWT decoder. Does NOT verify signature. */
export interface JwtPayload {
  sub?: string;
  exp?: number;
  is_admin?: boolean;
  username?: string;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "===".slice((payload.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
