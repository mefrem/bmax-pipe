import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bmax-pipe",
  description: "AI app factory orchestration"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
