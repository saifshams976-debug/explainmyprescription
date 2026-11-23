import { createClient } from "@supabase/supabase-js";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { GUEST_COOKIE, GUEST_SESSION_SECONDS } from "./guest-policy";

// Only called after verifying a same-origin browser request. No health data is stored here.
export function verifyGuestOrigin() {
  const request = getRequest();
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const allowedHost = forwardedHost?.split(",")[0]?.trim() || new URL(request.url).host;
  if (!origin || new URL(origin).host !== allowedHost || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new Error("Please use guest access from the Knowdose website.");
  }
  setResponseHeader("Cache-Control", "no-store");
  return request;
}

function guestClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Guest access is temporarily unavailable. Please try again later.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function guestToken(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${GUEST_COOKIE}=`));
  const token = cookie?.slice(GUEST_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function readGuestAccess(request: Request) {
  const token = guestToken(request);
  if (!token) return false;
  const { data, error } = await guestClient().from("guest_ai_sessions").select("expires_at").eq("token_hash", await hash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Guest access is temporarily unavailable. Please try again later.");
  return Boolean(data);
}

export async function beginGuestAccess(request: Request) {
  if (await readGuestAccess(request)) return { active: true };
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + GUEST_SESSION_SECONDS * 1000).toISOString();
  const { error } = await guestClient().from("guest_ai_sessions").insert({ token_hash: await hash(token), expires_at: expiresAt });
  if (error) throw new Error("Guest access is temporarily unavailable. Please try again later.");
  const secure = new URL(request.headers.get("origin") || request.url).protocol === "https:" ? "; Secure" : "";
  setResponseHeader("Set-Cookie", `${GUEST_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${GUEST_SESSION_SECONDS}${secure}`);
  return { active: true };
}

export async function consumeGuestAccess(request: Request) {
  const token = guestToken(request);
  if (!token) throw new Error("Choose Continue as guest or sign in before continuing.");
  // Hosting supplies this header. Do not trust client-provided forwarded-for values.
  const network = request.headers.get("cf-connecting-ip") || (new URL(request.url).hostname === "localhost" ? "local-preview" : "unidentified-network");
  const { data, error } = await guestClient().rpc("consume_guest_ai", {
    p_token_hash: await hash(token),
    p_network_hash: await hash(`knowdose-guest:${new Date().toISOString().slice(0, 10)}:${network}`),
  });
  if (error) throw new Error("Guest access is temporarily unavailable. Please try again later.");
  if (data !== true) throw new Error("Guest access has expired or reached today's usage allowance. Sign in to continue, or try again tomorrow.");
}

export async function invokeGuestMedication(name: "explain-prescription" | "compare-medications", body: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await guestClient().functions.invoke(name, { body });
  if (error || data?.error) throw new Error("The explanation service is temporarily unavailable. Please try again later.");
  return data;
}

export async function verifySignedInAI(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return false;
  if (!authorization.startsWith("Bearer ")) throw new Error("Please sign in again.");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The service is temporarily unavailable.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw new Error("Please sign in again.");
  return true;
}