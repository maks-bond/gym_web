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
            <h1 className="brand-title">
              <span className="brand-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M3 9h2v6H3zM6 8h2v8H6zM16 8h2v8h-2zM19 9h2v6h-2zM8 10h8v4H8z" />
                </svg>
              </span>
              Maksym Gym
            </h1>
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
                  <path d="M3 10h2v4H3zM6 9h2v6H6zM8 11h8M16 9h2v6h-2zM19 10h2v4h-2z" />
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
