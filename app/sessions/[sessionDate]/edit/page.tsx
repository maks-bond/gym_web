"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ExercisePicker, {
  type Exercise,
  type SelectedExercise,
  toExerciseItems,
} from "../../../components/exercise-picker";

type Location = { locationId: string; name: string };
type SessionPayload = {
  sessionId: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  locationId: string;
  exerciseItems: Array<{ exerciseId: string; name?: string; notes?: string }>;
};

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionDate: string }>();
  const sessionId = Array.isArray(params.sessionDate) ? params.sessionDate[0] : params.sessionDate;
  const [sessionDate, setSessionDate] = useState("");

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("unknown");
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;

      const [locationsRes, exercisesRes, sessionRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/exercises?limit=500"),
        fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`),
      ]);

      const locationsPayload = await locationsRes.json();
      const exercisesPayload = await exercisesRes.json();
      const sessionPayload = await sessionRes.json();

      if (!locationsRes.ok) throw new Error(locationsPayload.error || "Failed to load locations");
      if (!exercisesRes.ok) throw new Error(exercisesPayload.error || "Failed to load exercise list");
      if (!sessionRes.ok) throw new Error(sessionPayload.error || "Failed to load session");

      const loadedLocations = (locationsPayload.locations || []) as Location[];
      const loadedExercises = (exercisesPayload.exercises || []) as Exercise[];
      const session = sessionPayload.session as SessionPayload;

      setLocations(loadedLocations);
      setLibrary(loadedExercises);
      setSessionDate(session.sessionDate);
      setLocationId(session.locationId || "unknown");

      const byId = new Map(loadedExercises.map((x) => [x.exerciseId, x]));
      setSelected(
        session.exerciseItems.map((item) => ({
          ...(byId.get(item.exerciseId) || {
            exerciseId: item.exerciseId,
            name: item.name || item.exerciseId,
          }),
          notes: item.notes || "",
        })),
      );
    }

    loadData()
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId || !sessionDate) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sessionDate,
          locationId,
          exerciseItems: toExerciseItems(selected),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update session");
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
      {sessionDate ? <p className="helper">{sessionDate}</p> : null}

      <form onSubmit={onSubmit} className="card">
        {isLoading ? <p className="helper">Loading session...</p> : null}

        <div style={{ marginBottom: 12 }}>
          <button
            className="button"
            type="submit"
            disabled={isLoading || isSaving || selected.length === 0}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="row">
          <label htmlFor="location">Location</label>
          <select
            id="location"
            className="input"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={isLoading}
          >
            {locations.map((loc) => (
              <option key={loc.locationId} value={loc.locationId}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <ExercisePicker
          library={library}
          selected={selected}
          onChange={setSelected}
          disabled={isLoading}
        />

        <div style={{ marginTop: 12 }}>
          <button
            className="button"
            type="submit"
            disabled={isLoading || isSaving || selected.length === 0}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {error ? <p className="helper">Error: {error}</p> : null}
      </form>
    </section>
  );
}
