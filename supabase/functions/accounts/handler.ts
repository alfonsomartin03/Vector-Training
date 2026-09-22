import { email, object, page, profilePatch, RequestError, text, uuid } from "./validation.ts";

export type Account = { id: string; email?: string; created_at?: string; last_sign_in_at?: string; email_confirmed_at?: string };
export interface AccountStore {
  authenticate(token: string): Promise<Account | null>;
  isAdmin(id: string): Promise<boolean>;
  directory(search: string, page: number): Promise<unknown>;
  account(id: string): Promise<Account | null>;
  details(id: string, page: number): Promise<unknown>;
  updateProfile(id: string, patch: Record<string, string | number | null>): Promise<void>;
  updateEmail(id: string, email: string): Promise<void>;
  setAdmin(id: string, enabled: boolean): Promise<void>;
  verifyPassword(account: Account, password: string): Promise<boolean>;
  canDelete(id: string): Promise<boolean>;
  deleteAccount(id: string): Promise<void>;
}

const DEFAULT_ALLOWED_ORIGINS = [
  "https://vectortrain.me",
  "https://www.vectortrain.me",
  "https://vector-training.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006",
] as const;
const ACTIONS = new Set(["access", "list", "details", "update-profile", "update-email", "set-admin", "delete-self", "delete-user"]);

type HandlerOptions = { allowedOrigins?: readonly string[] };

function responseHeaders(request: Request, allowedOrigins: ReadonlySet<string>) {
  const origin = request.headers.get("Origin");
  return {
    ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}
const json = (request: Request, allowedOrigins: ReadonlySet<string>, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...responseHeaders(request, allowedOrigins), "Content-Type": "application/json; charset=utf-8" },
});

export function createAccountHandler(store: AccountStore, options: HandlerOptions = {}) {
  const allowedOrigins = new Set(options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS);
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    if (origin && !allowedOrigins.has(origin)) return json(request, allowedOrigins, { error: "Origin is not allowed." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(request, allowedOrigins) });
    if (request.method !== "POST") return json(request, allowedOrigins, { error: "Method not allowed." }, 405);
    try {
      const bearer = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
      if (!bearer) throw new RequestError(401, "Sign in to continue.");
      const actor = await store.authenticate(bearer);
      if (!actor) throw new RequestError(401, "Your session is no longer valid. Sign in again.");
      const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
      if (contentType !== "application/json") throw new RequestError(415, "Content-Type must be application/json.");
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > 16000) throw new RequestError(413, "Request is too large.");
      let body: Record<string, unknown>;
      try { body = object(JSON.parse(raw)); } catch { throw new RequestError(400, "Invalid request body."); }
      const action = text(body.action, "action", 40);
      if (!ACTIONS.has(action)) throw new RequestError(400, "Unknown account action.");
      const isAdmin = await store.isAdmin(actor.id);
      if (action === "access") return json(request, allowedOrigins, { isAdmin });
      // A self-service delete always derives its target from the verified token.
      if (action !== "delete-self" && !isAdmin) throw new RequestError(403, "Admin access is required.");
      if (action === "list") {
        if (body.search !== undefined && (typeof body.search !== "string" || body.search.length > 200)) throw new RequestError(400, "Search is too long.");
        return json(request, allowedOrigins, await store.directory((body.search as string | undefined)?.trim() ?? "", page(body.page)));
      }
      if (action === "delete-self" && body.userId !== undefined) throw new RequestError(400, "Self-service deletion cannot specify another account.");
      const targetId = action === "delete-self" ? actor.id : uuid(body.userId);
      const target = await store.account(targetId);
      if (!target) throw new RequestError(404, "This account no longer exists.");
      if (action === "details") return json(request, allowedOrigins, await store.details(targetId, page(body.page)));
      if (action === "update-profile") {
        await store.updateProfile(targetId, profilePatch(body.profile));
        return json(request, allowedOrigins, { success: true });
      }
      if (["delete-self", "delete-user", "set-admin", "update-email"].includes(action)) {
        if (typeof body.password !== "string" || body.password.length === 0 || body.password.length > 1024 || !await store.verifyPassword(actor, body.password)) {
          throw new RequestError(403, "Your current password could not be verified.");
        }
      }
      if (action === "update-email") {
        await store.updateEmail(targetId, email(body.email));
        return json(request, allowedOrigins, { success: true });
      }
      if (action === "set-admin") {
        if (targetId === actor.id) throw new RequestError(409, "Ask another admin to change your admin access.");
        if (typeof body.enabled !== "boolean") throw new RequestError(400, "Choose an account role.");
        await store.setAdmin(targetId, body.enabled);
        return json(request, allowedOrigins, { success: true });
      }
      if (action === "delete-self" || action === "delete-user") {
        if (action === "delete-user" && targetId === actor.id) throw new RequestError(409, "Use your profile to delete your own account.");
        if (body.confirmation !== (target.email ?? target.id)) throw new RequestError(400, "The confirmation does not match the account.");
        if (!await store.canDelete(targetId)) throw new RequestError(409, "Assign another admin before deleting the last admin account.");
        await store.deleteAccount(targetId);
        return json(request, allowedOrigins, { success: true });
      }
      throw new RequestError(400, "Unknown account action.");
    } catch (error) {
      if (error instanceof RequestError) return json(request, allowedOrigins, { error: error.message }, error.status);
      // Never log request bodies, passwords or personal profile data.
      console.error("Account operation failed.");
      return json(request, allowedOrigins, { error: "The account operation could not be completed. Please retry." }, 500);
    }
  };
}
