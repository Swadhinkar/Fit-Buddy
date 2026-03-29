import { Dumbbell } from "lucide-react";

const MetricPanel = ({ label, value, note, color }) => (
  <div className="dashboard-soft-panel px-4 py-4">
    <p className="dashboard-label">{label}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: `rgb(${color})` }}>
      {value}
    </p>
    <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{note}</p>
  </div>
);

const WorkoutSummaryCard = ({
  exercises,
  risk,
  todayWorkoutVolume,
  workedOutToday,
  onOpenLog,
}) => (
  <div className="dashboard-card glass-panel p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl">
        <p className="dashboard-label" style={{ color: "rgb(var(--secondary))" }}>
          Today&apos;s Workout
        </p>
        <h3 className="mt-2 text-xl font-bold text-[rgb(var(--text-primary))]">
          Keep today&apos;s details clean and complete
        </h3>
        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
          Exercise details make your load, heatmap, and recovery score much more useful.
        </p>
      </div>

      <span className="dashboard-status-chip">{risk.level} risk</span>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <MetricPanel
        label="Exercises"
        value={exercises.length.toString()}
        note={exercises.length ? "Logged today" : "No exercise entries"}
        color="var(--secondary)"
      />
      <MetricPanel
        label="Volume"
        value={Math.round(todayWorkoutVolume || 0).toLocaleString()}
        note={workedOutToday ? "Total recorded load" : "Start with today's workout"}
        color="var(--primary)"
      />
    </div>

    {exercises.length ? (
      <div className="mt-6 space-y-3">
        {exercises.map((exercise) => (
          <div
            key={`${exercise.name}-${exercise.sets}-${exercise.reps}-${exercise.weight}`}
            className="dashboard-soft-panel flex items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {exercise.name}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                {exercise.sets} sets x {exercise.reps} reps
              </p>
            </div>

            <span className="dashboard-status-chip">{exercise.weight} kg</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="dashboard-soft-panel mt-6 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          No exercise details added yet.
        </p>
        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
          Add sets, reps, and weight so the dashboard can show useful progress and recovery
          signals.
        </p>
        <button
          type="button"
          onClick={onOpenLog}
          className="dashboard-cta-secondary mt-5 px-4 py-3 text-sm"
        >
          <Dumbbell size={16} />
          Add Exercise Details
        </button>
      </div>
    )}
  </div>
);

export default WorkoutSummaryCard;