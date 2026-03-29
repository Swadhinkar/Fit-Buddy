import { Activity, PlusCircle } from "lucide-react";
import { formatDisplayDate } from "../../utils/workoutAnalytics";

const SummaryTile = ({ label, value, tone }) => (
  <div className="dashboard-soft-panel px-4 py-4">
    <p className="dashboard-label">{label}</p>
    <p className="mt-2 text-base font-semibold text-[rgb(var(--text-primary))]">{value}</p>
    <div className="mt-3 h-1 rounded-full bg-[rgb(var(--card-depth-0))]">
      <div
        className="h-full rounded-full"
        style={{ width: "100%", backgroundColor: `rgb(${tone})`, opacity: 0.8 }}
      />
    </div>
  </div>
);

function getRiskTone(level) {
  if (level === "Critical") {
    return "var(--red-500)";
  }

  if (level === "High") {
    return "var(--accent)";
  }

  if (level === "Medium") {
    return "var(--yellow-500)";
  }

  return "var(--secondary)";
}

const DashboardHero = ({
  dateLabel,
  isFetchingLog,
  nextStep,
  risk,
  activeDays,
  workedOutToday,
  todayExercises,
  todayWorkoutVolume,
  onOpenLog,
  onViewProgress,
}) => {
  const summaryItems = [
    {
      label: "Next step",
      value: nextStep.title,
      tone: "var(--primary)",
    },
    {
      label: "Today's load",
      value: todayExercises.length
        ? `${Math.round(todayWorkoutVolume || 0).toLocaleString()} total load`
        : "Add exercise details",
      tone: "var(--secondary)",
    },
    {
      label: "Recovery",
      value: `${risk.level} risk`,
      tone: getRiskTone(risk.level),
    },
  ];

  return (
    <div className="dashboard-card dashboard-card-emphasis glass-panel relative isolate overflow-hidden p-6 md:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full max-w-md bg-[rgb(var(--card-depth-1))/0.34]"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] xl:items-start">
        <div className="max-w-3xl">
          <p className="dashboard-label" style={{ color: "rgb(var(--primary))" }}>
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Stay on top of today&apos;s training
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--text-muted))] md:text-base">
            {nextStep.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="dashboard-status-chip">{dateLabel}</span>
            <span className="dashboard-status-chip">
              {workedOutToday ? "Workout logged" : "Workout pending"}
            </span>
            <span className="dashboard-status-chip">{activeDays} active days in 365 days</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={onOpenLog}
            disabled={isFetchingLog}
            className="dashboard-cta-primary w-full min-h-14 px-6 py-4 text-sm text-[rgb(var(--white))] sm:min-w-[250px]"
          >
            <PlusCircle size={18} />
            {isFetchingLog ? "Loading..." : "Log Today's Workout"}
          </button>

          <div className="space-y-3">
            {summaryItems.map((item) => (
              <SummaryTile key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;