import { CheckCircle, PlusCircle } from "lucide-react";

const ChecklistRow = ({ item }) => (
  <div className="dashboard-soft-panel flex items-start gap-3 px-4 py-4">
    <div
      className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full"
      style={{
        backgroundColor: item.complete
          ? "rgb(var(--secondary) / 0.14)"
          : "rgb(var(--card-depth-2) / 0.48)",
        color: item.complete ? "rgb(var(--secondary))" : "rgb(var(--text-muted))",
      }}
    >
      <CheckCircle size={14} />
    </div>
    <div>
      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.label}</p>
      <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{item.detail}</p>
    </div>
  </div>
);

const ActionChecklistCard = ({ nextStep, checklistItems, onOpenLog }) => (
  <div className="dashboard-card dashboard-card-emphasis glass-panel p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl">
        <p className="dashboard-label" style={{ color: "rgb(var(--primary))" }}>
          What To Do Next
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
          {nextStep.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
          Keep the essentials updated first so the rest of the dashboard stays accurate and easy to
          trust.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenLog}
        className="dashboard-cta-secondary px-4 py-2 text-sm"
      >
        <PlusCircle size={16} />
        Open Daily Log
      </button>
    </div>

    <div className="mt-6 space-y-3">
      {checklistItems.map((item) => (
        <ChecklistRow key={item.label} item={item} />
      ))}
    </div>
  </div>
);

export default ActionChecklistCard;