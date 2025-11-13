import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthProvider } from "@/components/session-provider";
import { AppHeader } from "@/components/app-header";
import { FeedbackWidget } from "@/components/feedback-widget";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <AuthProvider session={session}>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-6">{children}</main>
      <FeedbackWidget />
    </AuthProvider>
  );
}
