import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/projects";

type Stats = {
  totalUsers: number;
  totalProjects: number;
  successfulProjects: number;
  failedProjects: number;
  yoloProjects: number;
  bmaxProjects: number;
};

type RecentProject = {
  id: string;
  user_email: string;
  project_name: string;
  mode: string;
  status: string;
  created_at: Date;
  repo_url: string | null;
};

type TopTemplate = {
  name: string;
  count: number;
};

async function getStats(): Promise<Stats> {
  await ensureCoreSchema();

  const [userCount, projectCount, successCount, failedCount, yoloCount, bmaxCount] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM users`,
    sql`SELECT COUNT(*)::int as count FROM project_runs`,
    sql`SELECT COUNT(*)::int as count FROM project_runs WHERE status = 'completed'`,
    sql`SELECT COUNT(*)::int as count FROM project_runs WHERE status = 'failed'`,
    sql`SELECT COUNT(*)::int as count FROM project_runs WHERE mode = 'full'`,
    sql`SELECT COUNT(*)::int as count FROM project_runs WHERE mode = 'light'`,
  ]);

  return {
    totalUsers: userCount.rows[0]?.count || 0,
    totalProjects: projectCount.rows[0]?.count || 0,
    successfulProjects: successCount.rows[0]?.count || 0,
    failedProjects: failedCount.rows[0]?.count || 0,
    yoloProjects: yoloCount.rows[0]?.count || 0,
    bmaxProjects: bmaxCount.rows[0]?.count || 0,
  };
}

async function getRecentProjects(): Promise<RecentProject[]> {
  const result = await sql<RecentProject>`
    SELECT id, user_email, project_name, mode, status, created_at, repo_url
    FROM project_runs
    ORDER BY created_at DESC
    LIMIT 10
  `;
  return result.rows;
}

async function getTopTemplates(): Promise<TopTemplate[]> {
  const result = await sql<TopTemplate>`
    SELECT pt.name, COUNT(pr.id)::int as count
    FROM project_runs pr
    JOIN project_templates pt ON pr.template_slug = pt.slug
    WHERE pr.mode = 'full' AND pr.template_slug IS NOT NULL
    GROUP BY pt.name
    ORDER BY count DESC
    LIMIT 5
  `;
  return result.rows;
}

export default async function AdminPage() {
  const session = await auth();

  // Only allow your email (change this to your actual email)
  if (!session?.user?.email || session.user.email !== "maxim.efremov@gmail.com") {
    redirect("/dashboard");
  }

  const [stats, recentProjects, topTemplates] = await Promise.all([
    getStats(),
    getRecentProjects(),
    getTopTemplates(),
  ]);

  const successRate = stats.totalProjects > 0 
    ? ((stats.successfulProjects / stats.totalProjects) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Signed in users"
            color="blue"
          />
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle={`${stats.yoloProjects} YOLO, ${stats.bmaxProjects} BMAX`}
            color="indigo"
          />
          <StatCard
            title="Success Rate"
            value={`${successRate}%`}
            subtitle={`${stats.successfulProjects} succeeded, ${stats.failedProjects} failed`}
            color="green"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Projects</h2>
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No projects yet</p>
              ) : (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{project.project_name}</p>
                        <p className="text-sm text-slate-500">{project.user_email}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span className="uppercase">{project.mode === "full" ? "YOLO" : "BMAX"}</span>
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      {project.repo_url && (
                        <a
                          href={project.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Repo →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Templates */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Popular Templates</h2>
            <div className="space-y-3">
              {topTemplates.length === 0 ? (
                <p className="text-sm text-slate-500">No template usage yet</p>
              ) : (
                topTemplates.map((template, index) => (
                  <div key={template.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-900">{template.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {template.count} {template.count === 1 ? "use" : "uses"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mode Breakdown */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Mode Breakdown</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.yoloProjects}</div>
              <div className="text-sm text-slate-600">YOLO Mode Projects</div>
              <div className="mt-2 text-xs text-slate-500">
                Template-based or custom brief orchestrations
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.bmaxProjects}</div>
              <div className="text-sm text-slate-600">BMAX Mode Projects</div>
              <div className="mt-2 text-xs text-slate-500">
                PRD + Architecture orchestrations
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: "blue" | "indigo" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className={`rounded-lg border border-slate-200 p-6 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs opacity-70">{subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-rose-100 text-rose-700",
    processing: "bg-yellow-100 text-yellow-700",
  };

  const color = colors[status as keyof typeof colors] || "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

