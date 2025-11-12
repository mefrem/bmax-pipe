import { signIn } from "@/lib/auth";

export default function HomePage() {
  async function handleSignIn() {
    "use server";
    await signIn("github", { redirectTo: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">Gauntlet AI App Factory</p>
      <div className="space-y-4">
        <h1 className="text-5xl font-semibold">bmax</h1>
        <p className="mx-auto max-w-xl text-lg text-slate-200">
          Claude + BMAD orchestration in two clicks
        </p>
      </div>
      <form action={handleSignIn}>
        <button
          type="submit"
          className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-indigo-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.48-1.33-5.48-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.84c1.02.01 2.05.14 3.01.41 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5"
            />
          </svg>
          Sign in with GitHub
        </button>
      </form>
      <p className="text-xs text-indigo-200/60">
        Secure OAuth via GitHub. We never store your password.
      </p>
    </main>
  );
}
