import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ScottResource =
  | "colors"
  | "profit_margins"
  | "authorized_brands"
  | "asset_infos"
  | "size_types"
  | "base_product_types"
  | "promotions"
  | "settings";

const ALLOWED: Set<ScottResource> = new Set([
  "colors",
  "profit_margins",
  "authorized_brands",
  "asset_infos",
  "size_types",
  "base_product_types",
  "promotions",
  "settings",
]);

interface ScottProxyPayload {
  resource: ScottResource;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  pathSuffix?: string;
  query?: Record<string, string | number | boolean | undefined>;
  /** Plain fields + optional file fields as { __base64File: true, data: string, filename: string } */
  body?: Record<string, unknown> | null;
  /** settings only: use "airtable_sync" */
  settingsAction?: "airtable_sync";
  /** Optional explicit Scott API base URL (must be in allowlist). */
  baseUrl?: string;
}

let cachedScott: { token: string; exp: number } | null = null;

function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : 0;
  } catch {
    return 0;
  }
}

async function getScottAuthToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedScott && cachedScott.exp > now + 120) {
    return cachedScott.token;
  }

  const baseUrl = Deno.env.get("SCOTT_API_BASE_URL")?.replace(/\/$/, "");
  const email = Deno.env.get("SCOTT_AUTH_EMAIL");
  const password = Deno.env.get("SCOTT_AUTH_PASSWORD");
  if (!baseUrl || !email || !password) {
    throw new Error("Missing SCOTT_API_BASE_URL, SCOTT_AUTH_EMAIL, or SCOTT_AUTH_PASSWORD");
  }

  const res = await fetch(`${baseUrl}/api/v1/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password }),
  });

  const json = await res.json();
  if (!json?.success || !json?.data?.user?.auth_token) {
    console.error("Scott authenticate failed", json);
    throw new Error(json?.message || "Scott authentication failed");
  }

  const token = json.data.user.auth_token as string;
  const exp = decodeJwtExp(token) || now + 3600;
  cachedScott = { token, exp };
  return token;
}

function buildQueryString(q?: Record<string, string | number | boolean | undefined>): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isFilePayload(v: unknown): v is {
  __base64File: true;
  data: string;
  filename: string;
} {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as Record<string, unknown>).__base64File === true &&
    typeof (v as Record<string, unknown>).data === "string" &&
    typeof (v as Record<string, unknown>).filename === "string"
  );
}

function bodyToFormData(body: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (isFilePayload(v)) {
      const bytes = base64ToUint8Array(v.data);
      const blob = new Blob([bytes]);
      fd.append(key, blob, v.filename);
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      continue;
    } else {
      fd.append(key, String(v));
    }
  }
  return fd;
}

function queryToFormData(q?: Record<string, string | number | boolean | undefined>): FormData {
  const fd = new FormData();
  if (!q) return fd;
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined) continue;
    fd.append(k, String(v));
  }
  return fd;
}

/**
 * Scott hosts most "dashboard masters" under `/api/v1/{resource}` on leaderboard.
 * The Postman collection also documents `/api/dashboard/v1/...`; that namespace is not
 * mounted on the current server for many resources (404). Prefer `/api/v1/` where verified.
 *
 * `base_product_types` list uses POST `/api/v1/products/base_product_types` (GET returns 404).
 */
function resolveScottUpstream(
  baseUrl: string,
  resource: ScottResource,
  method: ScottProxyPayload["method"],
  pathSuffix: string | undefined,
  query: Record<string, string | number | boolean | undefined> | undefined,
  body: Record<string, unknown> | null | undefined,
  settingsAction: string | undefined,
): { url: string; fetchMethod: "GET" | "POST" | "PATCH" | "DELETE"; fetchBody?: FormData } {
  const suffix = pathSuffix ? `/${pathSuffix.replace(/^\//, "")}` : "";
  const qs = buildQueryString(query);

  if (resource === "settings") {
    if (settingsAction !== "airtable_sync") {
      throw new Error("settings resource requires settingsAction: airtable_sync");
    }
    const b = body && typeof body === "object" ? body : {};
    return {
      url: `${baseUrl}/api/dashboard/v1/settings/airtable_sync${qs}`,
      fetchMethod: "POST",
      fetchBody: bodyToFormData(b as Record<string, unknown>),
    };
  }

  if (resource === "base_product_types") {
    if (!pathSuffix) {
      if (method === "GET") {
        return {
          url: `${baseUrl}/api/v1/products/base_product_types`,
          fetchMethod: "POST",
          fetchBody: queryToFormData(query),
        };
      }
      if (method === "POST") {
        const b = body && typeof body === "object" ? body : {};
        return {
          url: `${baseUrl}/api/v1/products/base_product_types`,
          fetchMethod: "POST",
          fetchBody: bodyToFormData(b as Record<string, unknown>),
        };
      }
    }
    const b = body && typeof body === "object" ? body : {};
    return {
      url: `${baseUrl}/api/dashboard/v1/base_product_types${suffix}${qs}`,
      fetchMethod: method,
      fetchBody: method === "PATCH" || method === "POST" ? bodyToFormData(b as Record<string, unknown>) : undefined,
    };
  }

  const v1Masters: ScottResource[] = ["profit_margins", "promotions", "size_types"];
  if (v1Masters.includes(resource)) {
    const b = body && typeof body === "object" ? body : {};
    return {
      url: `${baseUrl}/api/v1/${resource}${suffix}${qs}`,
      fetchMethod: method,
      fetchBody: method === "POST" || method === "PATCH" ? bodyToFormData(b as Record<string, unknown>) : undefined,
    };
  }

  const seg = resource;
  const b = body && typeof body === "object" ? body : {};
  return {
    url: `${baseUrl}/api/dashboard/v1/${seg}${suffix}${qs}`,
    fetchMethod: method,
    fetchBody: method === "POST" || method === "PATCH" ? bodyToFormData(b as Record<string, unknown>) : undefined,
  };
}

function allowlistedBaseUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  const allowlistRaw = Deno.env.get("SCOTT_API_BASE_URL_ALLOWLIST");
  const allowlist = (allowlistRaw ? allowlistRaw.split(",") : [
    "http://64.227.186.227",
    "https://leaderboard.sagarfab.com",
  ]).map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);

  return allowlist.includes(trimmed) ? trimmed : null;
}

function fallbackUrlIfDashboard404(url: string): string | null {
  // If dashboard namespace isn't mounted in an env (e.g. production), some resources may exist under /api/v1/
  if (!url.includes("/api/dashboard/v1/")) return null;
  return url.replace("/api/dashboard/v1/", "/api/v1/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasPermission } = await supabaseAdmin.rpc("user_is_admin", {
      _user_id: user.id,
    });
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as ScottProxyPayload;
    const { resource, method, pathSuffix, query, body, settingsAction, baseUrl: requestedBaseUrl } = payload;

    if (!resource || !ALLOWED.has(resource)) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl =
      allowlistedBaseUrl(requestedBaseUrl) ??
      Deno.env.get("SCOTT_API_BASE_URL")?.replace(/\/$/, "");
    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "SCOTT_API_BASE_URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scottToken = await getScottAuthToken();
    const resolved = resolveScottUpstream(
      baseUrl,
      resource,
      method,
      pathSuffix,
      query,
      body,
      settingsAction,
    );

    const headers: Record<string, string> = {
      Authorization: scottToken,
    };

    let scottRes: Response;

    const doFetch = async (url: string): Promise<Response> => {
      if (resolved.fetchMethod === "GET" || resolved.fetchMethod === "DELETE") {
        return await fetch(url, { method: resolved.fetchMethod, headers });
      }
      const fd =
        resolved.fetchBody ??
        bodyToFormData((body && typeof body === "object" ? body : {}) as Record<string, unknown>);
      return await fetch(url, {
        method: resolved.fetchMethod,
        headers,
        body: fd,
      });
    };

    scottRes = await doFetch(resolved.url);

    // Fallback: if dashboard routes 404 in an environment, retry under /api/v1/ when possible.
    if (scottRes.status === 404) {
      const fb = fallbackUrlIfDashboard404(resolved.url);
      if (fb) {
        scottRes = await doFetch(fb);
      }
    }

    const text = await scottRes.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text };
    }

    return new Response(
      JSON.stringify({
        ok: scottRes.ok,
        upstreamStatus: scottRes.status,
        body: parsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("scott-dashboard-masters error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
