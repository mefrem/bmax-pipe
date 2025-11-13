import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const isAdmin = session.user.email === "maxim.efremov@gmail.com";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-semibold text-slate-900">
            bmax
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-900"
            >
              Admin
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <span className="text-sm text-slate-500">{session.user.email}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}

