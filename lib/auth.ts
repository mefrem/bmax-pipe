import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { Pool } from "pg";

import { env } from "@/lib/env";
import { ensureAuthSchema } from "@/lib/auth-schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  global._pgPool ??
  new Pool({
    connectionString: env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

await ensureAuthSchema(pool);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email public_repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save user to database on sign in
      if (user && account && profile) {
        const client = await pool.connect();
        try {
          // Upsert user
          await client.query(
            `
            INSERT INTO users (id, name, email, image)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              image = EXCLUDED.image
            `,
            [String(profile.id), user.name, user.email, user.image]
          );

          // Upsert account
          await client.query(
            `
            INSERT INTO accounts (
              "userId", type, provider, "providerAccountId",
              access_token, expires_at, token_type, scope, id_token
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (provider, "providerAccountId")
            DO UPDATE SET
              access_token = EXCLUDED.access_token,
              expires_at = EXCLUDED.expires_at,
              token_type = EXCLUDED.token_type,
              scope = EXCLUDED.scope,
              id_token = EXCLUDED.id_token
            `,
            [
              String(profile.id),
              account.type,
              account.provider,
              account.providerAccountId,
              account.access_token,
              account.expires_at,
              account.token_type,
              account.scope,
              account.id_token,
            ]
          );
        } finally {
          client.release();
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.id;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      if (session.user && token.accessToken) {
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});
