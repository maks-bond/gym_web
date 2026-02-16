"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Exercise = { exerciseId: string; name: string; usageCount?: number };
type Location = { locationId: string; name: string };

export default function NewSessionPage() {
  const router = useRouter();

  const [sessionDate, setSessionDate] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("unknown");

  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocations() {
      const res = await fetch("/api/locations");
      const payload = await res.json();
      const rows = (payload.locations || []) as Location[];
      setLocations(rows);
      if (rows.find((x) => x.locationId === "unknown")) {
        setLocationId("unknown");
      } else if (rows[0]) {
        setLocationId(rows[0].locationId);
      }
    }

    loadLocations().catch(() => {
      setError("Failed to load locations");
    });
  }, []);

  useEffect(() => {
    async function loadExercises() {
      const params = new URLSearchParams({ q: "", limit: "500" });
      const res = await fetch(`/api/exercises?${params.toString()}`);
      const payload = await res.json();
      setLibrary((payload.exercises || []) as Exercise[]);
    }

    loadExercises().catch(() => {
      setError("Failed to load exercise list");
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((x) => x.exerciseId)), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter((x) => x.name.toLowerCase().includes(q));
  }, [library, query]);

  function addExercise(exercise: Exercise) {
    if (selectedIds.has(exercise.exerciseId)) return;
    setSelected((prev) => [...prev, exercise]);
  }

  function removeExercise(exerciseId: string) {
    setSelected((prev) => prev.filter((x) => x.exerciseId !== exerciseId));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionDate,
          locationId,
          exerciseIds: selected.map((x) => x.exerciseId),
        }),
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
          <label htmlFor="location">Location</label>
          <select
            id="location"
            className="input"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.map((loc) => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label htmlFor="exercise-query">Exercises (type to filter)</label>
          <input
            id="exercise-query"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type e.g. Be"
          />
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label>Selected exercises</label>
          <div className="card" style={{ width: "100%", marginBottom: 0 }}>
            {selected.length === 0 ? <p className="helper">No exercises selected yet.</p> : null}
            {selected.map((exercise) => (
              <button
                key={exercise.exerciseId}
                type="button"
                className="button"
                style={{ marginRight: 8, marginBottom: 8 }}
                onClick={() => removeExercise(exercise.exerciseId)}
              >
                {exercise.name} ×
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label>Exercise list</label>
          <div className="card" style={{ width: "100%", maxHeight: 320, overflow: "auto", marginBottom: 0 }}>
            {filtered
              .filter((x) => !selectedIds.has(x.exerciseId))
              .map((exercise) => (
                <button
                  key={exercise.exerciseId}
                  type="button"
                  className="button"
                  style={{ marginRight: 8, marginBottom: 8 }}
                  onClick={() => addExercise(exercise)}
                >
                  + {exercise.name}
                </button>
              ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="button"
            type="submit"
            disabled={isSaving || selected.length === 0 || !sessionDate}
          >
            {isSaving ? "Saving..." : "Save Session"}
          </button>
        </div>

        {error ? <p className="helper">Error: {error}</p> : null}
      </form>
    </section>
  );
}
