import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  `http://localhost:${process.env.APP_BACKEND_PORT || "8000"}`;

/**
 * Authenticated reverse proxy to the FastAPI backend.
 * Validates the NextAuth session server-side, then forwards the request to
 * `${FASTAPI_URL}/api/<path>` injecting `x-user-id` (and an optional Bearer
 * key). The browser never talks to the backend directly — only via this route.
 */
async function proxyRequest(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { path } = await params;
  const url = new URL(`${FASTAPI_URL}/api/${path.join("/")}`);

  // Forward query params.
  const reqUrl = new URL(request.url);
  reqUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const userId = (session.user as Record<string, unknown>).id as string;
  headers.set("x-user-id", userId);

  // Optional shared secret — must match the backend's APP_API_KEY when set.
  if (process.env.BACKEND_API_KEY) {
    headers.set("authorization", `Bearer ${process.env.BACKEND_API_KEY}`);
  }

  let body: ArrayBuffer | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  const resp = await fetch(url.toString(), { method: request.method, headers, body });

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

export const fetchCache = "force-no-store";
