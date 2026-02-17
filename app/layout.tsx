import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maksym Gym",
  description: "Track your gym sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header className="header">
            <h1>Maksym Gym</h1>
            <nav className="nav">
              <Link href="/" className="nav-icon" title="Sessions" aria-label="Sessions">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 7h14M5 12h14M5 17h14" />
                </svg>
              </Link>
              <Link href="/new" className="nav-icon" title="New Session" aria-label="New Session">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
              <Link href="/exercises" className="nav-icon" title="Exercises" aria-label="Exercises">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 10h4v4H4zM16 10h4v4h-4zM8 11h8M8 13h8" />
                </svg>
              </Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
