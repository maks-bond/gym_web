import { listExercises } from "@/lib/sessions-repo";
export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const exercises = await listExercises("", 500);

  return (
    <section>
      <h2>Exercises</h2>
      <p className="helper">Sorted by your configured frequency order.</p>
      <div className="card">
        {exercises.map((exercise) => (
          <div key={exercise.exerciseId} style={{ marginBottom: 8 }}>
            <strong>{exercise.name}</strong>
            <span className="helper" style={{ marginLeft: 8 }}>
              count: {exercise.usageCount ?? 0}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
