import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Collection } from "mongodb";
import clientPromise from "./mongodb";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.AUTH_DB || "myapp");
}

// Unique index on email: prevents duplicates and closes the TOCTOU race on
// first-admin bootstrap (two concurrent logins can't both create the owner).
let _indexesEnsured = false;
async function ensureUserIndexes(users: Collection) {
  if (_indexesEnsured) return;
  try {
    await users.createIndex({ email: 1 }, { unique: true });
    _indexesEnsured = true;
  } catch (e) {
    console.warn("ensureUserIndexes: unique index on users.email not created:", e);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db = await getDb();
        const users = db.collection("users");
        await ensureUserIndexes(users);
        const email = credentials.email.toLowerCase();

        // First-admin bootstrap. If BOOTSTRAP_ADMIN_EMAIL is set, only that
        // email may become the initial admin (closes the takeover window on a
        // publicly-reachable deploy). Otherwise the very first user wins.
        const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
        let user = await users.findOne({ email });
        if (!user) {
          const count = await users.countDocuments();
          const canBootstrap = count === 0 && (!bootstrapEmail || email === bootstrapEmail);
          if (canBootstrap) {
            const hashed = await hash(credentials.password, 12);
            try {
              const result = await users.insertOne({
                name: email.split("@")[0],
                email,
                password: hashed,
                role: "admin",
                isSuperAdmin: true,
                provider: "credentials",
                deny: false,
                createdAt: new Date(),
              });
              user = await users.findOne({ _id: result.insertedId });
            } catch (e: unknown) {
              // Concurrent race: the unique index rejected the second insert —
              // another login already created the user, so re-read it.
              if ((e as { code?: number })?.code === 11000) {
                user = await users.findOne({ email });
              } else {
                throw e;
              }
            }
          }
        }

        if (!user || user.deny || !user.password) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user",
          isSuperAdmin: user.isSuperAdmin || user.role === "admin" || false,
        };
      },
    }),

    // ── Optional: add an OAuth/SSO provider ──────────────────────────────
    // next-auth ships many providers. Example (uncomment + set env):
    //
    //   import GoogleProvider from "next-auth/providers/google";
    //   ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   })] : []),
    //
    // Mirror the bootstrap/deny logic in the signIn callback for the new
    // provider, and persist the user the same way as above.
  ],

  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },

  pages: { signIn: "/auth" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as unknown as Record<string, unknown>).role;
        token.isSuperAdmin =
          (user as unknown as Record<string, unknown>).isSuperAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
};
