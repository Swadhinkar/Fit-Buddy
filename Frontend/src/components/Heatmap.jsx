import { Activity } from "lucide-react";
import { formatDisplayDate } from "../utils/workoutAnalytics";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INTENSITY_CLASS_NAMES = [
  "bg-[rgb(var(--card-depth-1))]/40",
  "bg-emerald-300/70",
  "bg-emerald-400/80",
  "bg-emerald-500/85",
  "bg-emerald-600 shadow-[0_0_12px_rgba(22,163,74,0.25)]",
];

const LEGEND_LABELS = ["Rest", "Light", "Building", "Strong", "Peak"];

const getRiskBorderClass = (riskScore) => {
  if (!Number.isFinite(riskScore)) {
    return "border border-[rgb(var(--card-depth-2))]";
  }

  if (riskScore >= 80) {
    return "border-2 border-red-400 shadow-[0_0_8px_rgba(220,38,38,0.32)]";
  }

  if (riskScore >= 60) {
    return "border-2 border-amber-400 shadow-[0_0_8px_rgba(234,179,8,0.24)]";
  }

  if (riskScore >= 30) {
    return "border-2 border-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.22)]";
  }

  return "border border-[rgb(var(--card-depth-2))]";
};

export default function Heatmap({ data, isLoading = false, error = "" }) {
  const columns = data?.columns ?? 0;
  const cells = data?.cells ?? [];
  const monthLabels = data?.monthLabels ?? [];
  const activeDays = data?.activeDays ?? 0;

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--secondary))]">
            Training Heatmap
          </p>
          <h3 className="mt-2 text-xl font-bold">GitHub-style workout consistency</h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            Weeks run left to right. Rows stay locked from Monday through Sunday.
          </p>
        </div>

        <div className="rounded-2xl bg-[rgb(var(--card-depth-1))/0.45] px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
            Active Days
          </p>
          <p className="mt-2 text-2xl font-bold text-[rgb(var(--secondary))]">
            {isLoading ? "--" : activeDays}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--card-depth-1))/0.35] px-3 py-1.5 text-xs text-[rgb(var(--text-muted))]">
          <Activity size={14} className="text-[rgb(var(--secondary))]" />
          Intensity uses logged volume first, then exercise minutes when volume is unavailable.
        </div>

        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
          {LEGEND_LABELS.map((label, index) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-[4px] ${INTENSITY_CLASS_NAMES[index]}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-max">
          <div
            className="mb-3 grid items-center gap-x-1 pl-12 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-muted))]"
            style={{ gridTemplateColumns: `repeat(${columns}, var(--heatmap-cell-size))` }}
          >
            {monthLabels.map((label, index) => (
              <div key={`${label || "month"}-${index}`} className="text-left">
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="grid grid-rows-7 gap-1 text-[11px] font-medium text-[rgb(var(--text-muted))]">
              {DAY_LABELS.map((label) => (
                <div key={label} className="flex h-3 items-center sm:h-[14px]">
                  {label}
                </div>
              ))}
            </div>

            <div className="heatmap-grid" aria-label="Workout contribution heatmap">
              {cells.map((cell) => (
                <div
                  key={cell.key}
                  title={buildTooltipLabel(cell)}
                  className={`rounded-[4px] transition-transform duration-150 hover:scale-110 ${
                    INTENSITY_CLASS_NAMES[cell.intensity]
                  } ${getRiskBorderClass(cell.riskScore)} ${cell.date ? "cursor-pointer" : "opacity-0"}`}
                  aria-label={buildTooltipLabel(cell)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildTooltipLabel(cell) {
  if (!cell?.date) {
    return "Outside current range";
  }

  const activityText = cell.isActive
    ? cell.log?.volume > 0
      ? `${cell.log.volume.toLocaleString()} total load`
      : `${cell.log?.exerciseTime ?? 0} minutes logged`
    : "no workout logged";

  const riskText = Number.isFinite(cell.riskScore) ? `Risk Score: ${cell.riskScore}` : "Risk Score: 0";

  return `${formatDisplayDate(cell.date)} | Activity: ${activityText} | ${riskText}`;
}
