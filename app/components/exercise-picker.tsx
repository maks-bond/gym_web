"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Exercise = { exerciseId: string; name: string; usageCount?: number };
export type SelectedExercise = Exercise & { notes: string };
type LastNotes = Record<string, { notes: string; sessionDate: string }>;

type Props = {
  library: Exercise[];
  selected: SelectedExercise[];
  onChange: (next: SelectedExercise[]) => void;
  disabled?: boolean;
};

export default function ExercisePicker({ library, selected, onChange, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [lastNotes, setLastNotes] = useState<LastNotes>({});
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/exercises/last-notes")
      .then((res) => res.json())
      .then((payload) => setLastNotes((payload.lastNotes || {}) as LastNotes))
      .catch(() => {
        // Hints only; the picker works without them.
      });
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((x) => x.exerciseId)), [selected]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library.filter(
      (x) => !selectedIds.has(x.exerciseId) && (!q || x.name.toLowerCase().includes(q)),
    );
  }, [library, query, selectedIds]);

  function addExercise(exercise: Exercise) {
    if (selectedIds.has(exercise.exerciseId)) return;
    onChange([...selected, { ...exercise, notes: "" }]);
    setQuery("");
    queryInputRef.current?.focus();
  }

  function removeExercise(exerciseId: string) {
    onChange(selected.filter((x) => x.exerciseId !== exerciseId));
  }

  function setNotes(exerciseId: string, notes: string) {
    onChange(selected.map((x) => (x.exerciseId === exerciseId ? { ...x, notes } : x)));
  }

  return (
    <>
      <div className="row" style={{ marginTop: 12 }}>
        <label htmlFor="exercise-query">Exercises (type to filter, Enter to add)</label>
        <input
          id="exercise-query"
          ref={queryInputRef}
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (query.trim() && available[0]) addExercise(available[0]);
          }}
          placeholder="Type e.g. Be"
          disabled={disabled}
        />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <label>Selected exercises</label>
        <div className="card" style={{ width: "100%", marginBottom: 0 }}>
          {selected.length === 0 ? <p className="helper">No exercises selected yet.</p> : null}
          {selected.map((exercise) => {
            const last = lastNotes[exercise.exerciseId];
            return (
              <div key={exercise.exerciseId} className="selected-exercise">
                <div className="selected-exercise-top">
                  <strong>{exercise.name}</strong>
                  <button
                    type="button"
                    className="button button-exercise button-small"
                    onClick={() => removeExercise(exercise.exerciseId)}
                    disabled={disabled}
                    aria-label={`Remove ${exercise.name}`}
                  >
                    ×
                  </button>
                </div>
                <input
                  className="input input-small"
                  value={exercise.notes}
                  onChange={(e) => setNotes(exercise.exerciseId, e.target.value)}
                  onKeyDown={(e) => {
                    // Enter jumps back to the filter instead of submitting the session.
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    queryInputRef.current?.focus();
                  }}
                  placeholder={last ? `last (${last.sessionDate}): ${last.notes}` : "notes, e.g. 60kg 3x8"}
                  disabled={disabled}
                  aria-label={`Notes for ${exercise.name}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <label>Exercise list</label>
        <div className="card" style={{ width: "100%", maxHeight: 320, overflow: "auto", marginBottom: 0 }}>
          {available.map((exercise) => (
            <button
              key={exercise.exerciseId}
              type="button"
              className="button button-exercise"
              style={{ marginRight: 8, marginBottom: 8 }}
              onClick={() => addExercise(exercise)}
              disabled={disabled}
            >
              + {exercise.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function toExerciseItems(selected: SelectedExercise[]) {
  return selected.map((x) => ({ exerciseId: x.exerciseId, notes: x.notes.trim() || undefined }));
}
