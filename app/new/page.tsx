"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSessionPage() {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState("");
  const [exerciseText, setExerciseText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const exercises = exerciseText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionDate, exercises }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to save session");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  return (
    <section>
      <h2>New Session</h2>
      <form onSubmit={onSubmit} className="card">
        <div className="row">
          <label htmlFor="session-date">Date</label>
          <input
            id="session-date"
            className="input"
            type="date"
            required
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label htmlFor="exercises">Exercises (one per line)</label>
          <textarea
            id="exercises"
            className="textarea"
            required
            value={exerciseText}
            onChange={(e) => setExerciseText(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Session"}
          </button>
        </div>

        {error ? <p className="helper">Error: {error}</p> : null}
      </form>
    </section>
  );
}
