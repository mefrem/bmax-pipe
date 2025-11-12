import { Pool } from "pg";

let initializing: Promise<void> | null = null;

export function ensureAuthSchema(pool: Pool) {
  if (!initializing) {
    initializing = (async () => {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            "emailVerified" TIMESTAMPTZ,
            image TEXT
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS accounts (
            id BIGSERIAL PRIMARY KEY,
            "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            provider TEXT NOT NULL,
            "providerAccountId" TEXT NOT NULL,
            refresh_token TEXT,
            access_token TEXT,
            expires_at BIGINT,
            token_type TEXT,
            scope TEXT,
            id_token TEXT,
            session_state TEXT,
            refresh_token_expires_in INT,
            CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId")
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            "sessionToken" TEXT NOT NULL UNIQUE,
            "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires TIMESTAMPTZ NOT NULL
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS verification_tokens (
            identifier TEXT NOT NULL,
            token TEXT NOT NULL,
            expires TIMESTAMPTZ NOT NULL,
            CONSTRAINT verification_tokens_identifier_token_key PRIMARY KEY (identifier, token)
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS authenticators (
            id TEXT PRIMARY KEY,
            "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            credential_id TEXT NOT NULL UNIQUE,
            provider TEXT,
            public_key TEXT NOT NULL,
            counter BIGINT NOT NULL,
            credential_device_type TEXT,
            credential_backed_up BOOLEAN,
            transports TEXT
          );
        `);
      } finally {
        client.release();
      }
    })();
  }

  return initializing;
}
