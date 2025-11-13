import { sql } from "@/lib/db";

let feedbackSchemaInitialized = false;

export async function ensureFeedbackSchema() {
  if (feedbackSchemaInitialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id text PRIMARY KEY,
      user_id text,
      user_email text,
      message text NOT NULL,
      screenshot_url text,
      user_agent text,
      page_url text,
      created_at timestamptz DEFAULT now()
    )
  `;

  feedbackSchemaInitialized = true;
}

