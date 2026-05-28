import { withAuth } from "next-auth/middleware";

/**
 * Auth gate (Next.js middleware — in Next 16 this file is `proxy.ts`,
 * formerly `middleware.ts`). Unauthenticated requests are redirected to
 * `pages.signIn` ("/auth"). The matcher scopes the gate so it never
 * intercepts the auth handler, public assets, the version probe, or the
 * /health rewrite.
 */
export default withAuth({});

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/version|_next/static|_next/image|favicon.ico|health|.*\\.svg).*)",
  ],
};
