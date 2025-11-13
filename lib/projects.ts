import path from "node:path";
import fs from "node:fs/promises";

import { sql } from "@/lib/db";

const projectsDir = path.join(process.cwd(), "resources", "projects");

type ProjectTemplateRecord = {
  slug: string;
  name: string;
  brief_path: string;
};

export async function ensureCoreSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS project_templates (
      slug text PRIMARY KEY,
      name text NOT NULL,
      brief_path text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS project_runs (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      user_email text,
      project_name text NOT NULL,
      mode text NOT NULL,
      template_slug text,
      brief_blob_url text,
      prd_blob_url text,
      architecture_blob_url text,
      frontend_blob_url text,
      repo_name text,
      repo_url text,
      status text NOT NULL,
      claude_instructions text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `;
}

export async function ensureProjectTemplates() {
  const entries = await fs.readdir(projectsDir);
  const mdFiles = entries.filter((file) => file.endsWith(".md"));
  const currentSlugs = mdFiles.map((file) => file.replace(/\.md$/i, ""));

  // Add or update templates from files
  await Promise.all(
    mdFiles.map(async (file) => {
      const slug = file.replace(/\.md$/i, "");
      let name = slug
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      
      // Remove "PRD " prefix if present
      if (name.startsWith("PRD ")) {
        name = name.substring(4);
      }
      
      const fullPath = path.join(projectsDir, file);

      await sql`
        INSERT INTO project_templates (slug, name, brief_path)
        VALUES (${slug}, ${name}, ${fullPath})
        ON CONFLICT (slug)
        DO UPDATE SET name = EXCLUDED.name, brief_path = EXCLUDED.brief_path, updated_at = now()
      `;
    })
  );

  // Remove templates that no longer have files
  if (currentSlugs.length > 0) {
    await sql`
      DELETE FROM project_templates
      WHERE slug NOT IN ${sql(currentSlugs)}
    `;
  }
}

export async function fetchProjectTemplates(): Promise<ProjectTemplateRecord[]> {
  const { rows } = await sql<ProjectTemplateRecord>`
    SELECT slug, name, brief_path
    FROM project_templates
    ORDER BY name ASC
  `;

  return rows;
}

export async function findProjectTemplate(slug: string) {
  const { rows } = await sql<ProjectTemplateRecord>`
    SELECT slug, name, brief_path
    FROM project_templates
    WHERE slug = ${slug}
    LIMIT 1
  `;

  return rows[0];
}
