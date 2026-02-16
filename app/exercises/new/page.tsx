"use client";

import { FormEvent, useState } from "react";

export default function NewExercisePage() {
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          aliases: aliases
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create exercise");
      }

      setStatus(`Created: ${payload.exercise.name} (${payload.exercise.exerciseId})`);
      setName("");
      setAliases("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <section>
      <h2>Create Exercise</h2>
      <form className="card" onSubmit={onSubmit}>
        <div className="row">
          <label htmlFor="name">Exercise name</label>
          <input
            id="name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <label htmlFor="aliases">Aliases (comma-separated)</label>
          <input
            id="aliases"
            className="input"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="button" type="submit">
            Add Exercise
          </button>
        </div>
        {status ? <p className="helper">{status}</p> : null}
        {error ? <p className="helper">Error: {error}</p> : null}
      </form>
    </section>
  );
}
