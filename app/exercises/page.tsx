"use client";

import { FormEvent, useEffect, useState } from "react";

type Exercise = {
  exerciseId: string;
  name: string;
  aliases?: string[];
  usageCount?: number;
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newAliases, setNewAliases] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAliases, setEditAliases] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadExercises() {
      const params = new URLSearchParams({ q: "", limit: "500" });
      const res = await fetch(`/api/exercises?${params.toString()}`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to load exercises");
      }

      setExercises((payload.exercises || []) as Exercise[]);
    }

    loadExercises().catch((err) => {
      setError(err instanceof Error ? err.message : "Unknown error");
    });
  }, []);

  function startEdit(exercise: Exercise) {
    setEditingId(exercise.exerciseId);
    setEditName(exercise.name);
    setEditAliases((exercise.aliases || []).join(", "));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAliases("");
    setIsSaving(false);
  }

  async function createNewExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newName,
          aliases: newAliases
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create exercise");
      }

      const created = payload.exercise as Exercise;
      setExercises((prev) => [created, ...prev.filter((x) => x.exerciseId !== created.exerciseId)]);
      setNewName("");
      setNewAliases("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCreating(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseId: editingId,
          name: editName,
          aliases: editAliases
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update exercise");
      }

      setExercises((prev) =>
        prev.map((exercise) => (exercise.exerciseId === editingId ? payload.exercise : exercise)),
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  return (
    <section>
      <h2>Exercises</h2>
      <p className="helper">Sorted by your configured frequency order.</p>

      <form className="card" onSubmit={createNewExercise}>
        <h3 style={{ marginTop: 0 }}>Add Exercise</h3>
        <div className="row">
          <label htmlFor="new-exercise-name">Name</label>
          <input
            id="new-exercise-name"
            className="input"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Romanian Deadlift"
          />
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <label htmlFor="new-exercise-aliases">Aliases (comma-separated)</label>
          <input
            id="new-exercise-aliases"
            className="input"
            value={newAliases}
            onChange={(e) => setNewAliases(e.target.value)}
            placeholder="e.g. RDL"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="button" type="submit" disabled={isCreating}>
            {isCreating ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      <div className="card">
        {exercises.map((exercise) => (
          <div key={exercise.exerciseId} style={{ marginBottom: 12 }}>
            {editingId === exercise.exerciseId ? (
              <form onSubmit={saveEdit}>
                <div className="row">
                  <label htmlFor={`name-${exercise.exerciseId}`}>Name</label>
                  <input
                    id={`name-${exercise.exerciseId}`}
                    className="input"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <label htmlFor={`aliases-${exercise.exerciseId}`}>Aliases (comma-separated)</label>
                  <input
                    id={`aliases-${exercise.exerciseId}`}
                    className="input"
                    value={editAliases}
                    onChange={(e) => setEditAliases(e.target.value)}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button className="button" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={cancelEdit}
                    style={{ marginLeft: 8 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <strong>{exercise.name}</strong>
                <span className="helper" style={{ marginLeft: 8 }}>
                  count: {exercise.usageCount ?? 0}
                </span>
                <button
                  className="button"
                  type="button"
                  onClick={() => startEdit(exercise)}
                  style={{ marginLeft: 8 }}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ))}

        {!error && exercises.length === 0 ? <p className="helper">No exercises yet.</p> : null}
        {error ? <p className="helper">Error: {error}</p> : null}
      </div>
    </section>
  );
}
