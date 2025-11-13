import { auth } from "@/lib/auth";
import { ensureCoreSchema, ensureProjectTemplates, fetchProjectTemplates } from "@/lib/projects";
import { sql } from "@/lib/db";

import { FullModeForm } from "@/components/dashboard/full-mode-form";
import { LightModeForm } from "@/components/dashboard/light-mode-form";
import { submitFullProject, submitLightProject } from "@/app/(app)/dashboard/actions";
import type { DashboardAction } from "@/app/(app)/dashboard/types";

interface RunRow {
  id: string;
  project_name: string;
  mode: string;
  status: string;
  repo_url: string | null;
  claude_instructions: string | null;
  created_at: Date;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  await ensureCoreSchema();
  await ensureProjectTemplates();
  const templates = await fetchProjectTemplates();

  const { rows: runs } = await sql<RunRow>`
    SELECT id, project_name, mode, status, repo_url, claude_instructions, created_at
    FROM project_runs
    WHERE user_id = ${session.user?.id ?? null}
    ORDER BY created_at DESC
    LIMIT 8
  `;

  const { rows: communityRuns } = await sql<RunRow>`
    SELECT id, project_name, mode, status, repo_url, claude_instructions, created_at
    FROM project_runs
    WHERE user_id != ${session.user?.id ?? null}
    ORDER BY created_at DESC
    LIMIT 5
  `;

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Choose a mode</h1>
        </div>
        
        <div className="relative grid gap-6 lg:grid-cols-2">
          <FullModeForm templates={templates} action={submitFullProject as DashboardAction} />
          
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <div className="rounded-full border-2 border-slate-300 bg-white px-4 py-2 font-semibold text-slate-500 shadow-sm">
              OR
            </div>
          </div>
          
          <LightModeForm action={submitLightProject as DashboardAction} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Recent runs</h2>
        <p className="text-sm text-slate-500">Track orchestration status and copy Claude instructions.</p>
        <div className="mt-4 divide-y divide-slate-200">
          {runs.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">No runs yet. Kick things off above.</p>
          ) : (
            runs.map((run) => (
              <article key={run.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{run.project_name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{run.mode}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      run.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : run.status === "failed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
                <div className="flex gap-4">
                  {run.repo_url ? (
                    <a
                      href={run.repo_url}
                      className="text-sm text-blue-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Repo →
                    </a>
                  ) : null}
                  {run.status === "completed" && (
                    <a
                      href="https://claude.ai/code"
                      className="text-sm text-blue-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Claude Code →
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {communityRuns.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700">Community Activity</h2>
          <p className="text-sm text-slate-500">See what others are building with bmax</p>
          <div className="mt-4 divide-y divide-slate-200">
            {communityRuns.map((run, index) => {
              const anonymousId = `gauntlet-anon-${100 + index}`;
              const timeAgo = Math.floor((Date.now() - new Date(run.created_at).getTime()) / 60000);
              const timeDisplay = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo} minutes ago` : `${Math.floor(timeAgo / 60)} hours ago`;
              
              return (
                <article key={run.id} className="flex flex-col gap-2 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        <span className="font-mono text-xs text-slate-500">{anonymousId}</span> started implementing{' '}
                        <span className="font-medium text-slate-900">{run.project_name}</span>
                      </p>
                      <p className="text-xs text-slate-500">{timeDisplay}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        run.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : run.status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-slate-200 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Open source on{' '}
          <a
            href="https://github.com/mefrem/bmax-pipe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
