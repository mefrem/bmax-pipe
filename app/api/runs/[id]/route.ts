import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/projects";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureCoreSchema();

  const { rows } = await sql<{
    id: string;
    status: string;
    repo_url: string | null;
    claude_instructions: string | null;
  }>`
    SELECT id, status, repo_url, claude_instructions
    FROM project_runs
    WHERE id = ${params.id} AND user_id = ${session.user.id}
    LIMIT 1
  `;

  const run = rows[0];

  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}
