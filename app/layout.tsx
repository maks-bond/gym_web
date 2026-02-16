import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gym Log",
  description: "Track your gym sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header className="header">
            <h1>Gym Log</h1>
            <nav className="nav">
              <Link href="/">Sessions</Link>
              <Link href="/new">New Session</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
