"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExercisePicker, {
  type Exercise,
  type SelectedExercise,
  toExerciseItems,
} from "../components/exercise-picker";
import { todayIsoLocal } from "@/lib/date";

type Location = { locationId: string; name: string };

export default function NewSessionPage() {
  const router = useRouter();

  const [sessionDate, setSessionDate] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("unknown");

  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const date = new URLSearchParams(window.location.search).get("date")?.trim() || "";
    setSessionDate(/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIsoLocal());
  }, []);

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

  // ?from=<sessionId> pre-fills exercises (and location) from an earlier session.
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from")?.trim();
    if (!from) return;

    fetch(`/api/sessions?sessionId=${encodeURIComponent(from)}`)
      .then((res) => res.json())
      .then((payload) => {
        const session = payload.session as
          | { locationId: string; exerciseItems: Array<{ exerciseId: string; name: string }> }
          | undefined;
        if (!session) return;
        setLocationId(session.locationId);
        setSelected(
          session.exerciseItems.map((x) => ({ exerciseId: x.exerciseId, name: x.name, notes: "" })),
        );
      })
      .catch(() => setError("Failed to load template session"));
  }, []);

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
          exerciseItems: toExerciseItems(selected),
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

        <ExercisePicker library={library} selected={selected} onChange={setSelected} />

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
