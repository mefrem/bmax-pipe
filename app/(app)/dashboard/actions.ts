"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadToBlob } from "@/lib/blob";
import {
  ensureCoreSchema,
  ensureProjectTemplates,
  findProjectTemplate
} from "@/lib/projects";
import { orchestrateRepository, OrchestrationPayload } from "@/lib/orchestrator";
import type { ActionResponse } from "@/app/(app)/dashboard/types";

const fullFormSchema = z.object({
  mode: z.enum(["template", "custom"]),
  templateSlug: z.string().optional(),
  projectName: z.string().min(2).max(80).optional()
});

const lightFormSchema = z.object({
  projectName: z.string().min(2).max(80)
});

export async function submitFullProject(formData: FormData): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { success: false, message: "You must be signed in." };
  }

  if (!session.user.accessToken) {
    return { success: false, message: "GitHub authorization required. Please sign out and sign in again to grant repository permissions." };
  }

  await ensureCoreSchema();
  await ensureProjectTemplates();

  const rawMode = formData.get("mode");
  const parsed = fullFormSchema.safeParse({
    mode: typeof rawMode === "string" ? rawMode : undefined,
    templateSlug: formData.get("templateSlug")?.toString(),
    projectName: formData.get("projectName")?.toString()
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid form submission." };
  }

  const { mode, templateSlug, projectName } = parsed.data;

  let finalProjectName = projectName;
  let briefSource: OrchestrationPayload["documents"][number] | null = null;
  let briefBlobUrl: string | null = null;
  let template;

  if (mode === "template") {
    if (!templateSlug) {
      return { success: false, message: "Select a template." };
    }

    template = await findProjectTemplate(templateSlug);

    if (!template) {
      return { success: false, message: "Template not found." };
    }

    finalProjectName = template.name;
    briefSource = {
      kind: "path",
      filename: "brief.md",
      path: template.brief_path
    };
  } else {
    if (!projectName) {
      return { success: false, message: "Provide a project name." };
    }

    const briefFile = formData.get("brief") as File | null;

    if (!briefFile || briefFile.size === 0) {
      return { success: false, message: "Upload a brief." };
    }

    const buffer = Buffer.from(await briefFile.arrayBuffer());

    const blob = await uploadToBlob(
      `briefs/${session.user.id}/${Date.now()}-${briefFile.name}`,
      new Blob([buffer], { type: briefFile.type || "text/markdown" })
    );

    briefBlobUrl = blob.url;

    briefSource = {
      kind: "buffer",
      filename: "brief.md",
      buffer,
      originalName: briefFile.name,
      blobUrl: briefBlobUrl
    };
  }

  if (!finalProjectName || !briefSource) {
    return { success: false, message: "Unable to prepare documents." };
  }

  const runId = randomUUID();

  await sql`
    INSERT INTO project_runs (id, user_id, user_email, project_name, mode, template_slug, status, brief_blob_url)
    VALUES (${runId}, ${session.user.id}, ${session.user.email}, ${finalProjectName}, 'full', ${
    template?.slug ?? null
  }, 'processing', ${briefBlobUrl})
  `;

  try {
    const payload: OrchestrationPayload = {
      mode: "full",
      projectName: finalProjectName,
      userEmail: session.user.email!,
      userAccessToken: session.user.accessToken,
      documents: [briefSource]
    };

    const result = await orchestrateRepository(payload);

    await sql`
      UPDATE project_runs
      SET status = 'completed', repo_name = ${result.repoName}, repo_url = ${
        result.repoUrl
      }, claude_instructions = ${result.claudeInstructions}, updated_at = now()
      WHERE id = ${runId}
    `;

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Repository orchestration queued successfully.",
      runId,
      result
    };
  } catch (error) {
    console.error("Full orchestration failed", error);
    await sql`
      UPDATE project_runs SET status = 'failed', updated_at = now()
      WHERE id = ${runId}
    `;
    return { success: false, message: "Failed to orchestrate repository." };
  }
}

export async function submitLightProject(formData: FormData): Promise<ActionResponse> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return { success: false, message: "You must be signed in." };
  }

  if (!session.user.accessToken) {
    return { success: false, message: "GitHub authorization required. Please sign out and sign in again to grant repository permissions." };
  }

  await ensureCoreSchema();

  const parsed = lightFormSchema.safeParse({
    projectName: formData.get("projectName")?.toString()
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid form submission." };
  }

  const { projectName } = parsed.data;

  const prdFile = formData.get("prd") as File | null;
  const architectureFile = formData.get("architecture") as File | null;
  const frontendSpecFile = formData.get("frontend") as File | null;

  if (!prdFile || prdFile.size === 0 || !architectureFile || architectureFile.size === 0) {
    return { success: false, message: "Upload PRD and Architecture documents." };
  }

  const prdBuffer = Buffer.from(await prdFile.arrayBuffer());
  const archBuffer = Buffer.from(await architectureFile.arrayBuffer());
  const frontendBuffer = frontendSpecFile ? Buffer.from(await frontendSpecFile.arrayBuffer()) : null;

  const [prdBlob, archBlob, frontendBlob] = await Promise.all([
    uploadToBlob(
      `prd/${session.user.id}/${Date.now()}-${prdFile.name}`,
      new Blob([prdBuffer], { type: prdFile.type || "text/markdown" })
    ),
    uploadToBlob(
      `architecture/${session.user.id}/${Date.now()}-${architectureFile.name}`,
      new Blob([archBuffer], { type: architectureFile.type || "text/markdown" })
    ),
    frontendBuffer && frontendSpecFile
      ? uploadToBlob(
          `frontend-spec/${session.user.id}/${Date.now()}-${frontendSpecFile.name}`,
          new Blob([frontendBuffer], { type: frontendSpecFile.type || "text/markdown" })
        )
      : Promise.resolve(null)
  ]);

  const documents: OrchestrationPayload["documents"] = [
    {
      kind: "buffer",
      filename: "prd.md",
      buffer: prdBuffer,
      originalName: prdFile.name,
      blobUrl: prdBlob.url
    },
    {
      kind: "buffer",
      filename: "architecture.md",
      buffer: archBuffer,
      originalName: architectureFile.name,
      blobUrl: archBlob.url
    }
  ];

  if (frontendBuffer && frontendSpecFile && frontendBlob) {
    documents.push({
      kind: "buffer",
      filename: "front-end-spec.md",
      buffer: frontendBuffer,
      originalName: frontendSpecFile.name,
      blobUrl: frontendBlob.url
    });
  }

  const runId = randomUUID();

  await sql`
    INSERT INTO project_runs (
      id, user_id, user_email, project_name, mode, status,
      prd_blob_url, architecture_blob_url, frontend_blob_url
    )
    VALUES (${runId}, ${session.user.id}, ${session.user.email}, ${projectName}, 'light', 'processing', ${
    prdBlob.url
  }, ${archBlob.url}, ${frontendBlob?.url ?? null})
  `;

  try {
    const result = await orchestrateRepository({
      mode: "light",
      projectName,
      userEmail: session.user.email!,
      userAccessToken: session.user.accessToken,
      documents
    });

    await sql`
      UPDATE project_runs
      SET status = 'completed', repo_name = ${result.repoName}, repo_url = ${
        result.repoUrl
      }, claude_instructions = ${result.claudeInstructions}, updated_at = now()
      WHERE id = ${runId}
    `;

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Repository orchestration queued successfully.",
      runId,
      result
    };
  } catch (error) {
    console.error("Light orchestration failed", error);
    await sql`
      UPDATE project_runs SET status = 'failed', updated_at = now()
      WHERE id = ${runId}
    `;
    return { success: false, message: "Failed to orchestrate repository." };
  }
}
