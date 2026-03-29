import { Activity, Mail, User } from "lucide-react";
import { formatDisplayDate } from "../../utils/workoutAnalytics";

const CompactInfo = ({ icon, label, value }) => (
  <div className="dashboard-soft-panel flex items-center gap-3 px-4 py-3">
    <div className="rounded-xl bg-[rgb(var(--card-depth-0))] p-2 text-[rgb(var(--primary))]">
      {icon}
    </div>
    <div>
      <p className="dashboard-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  </div>
);

const AccountSummaryCard = ({ user, latestLogDate, hasWeightToday }) => (
  <div className="dashboard-card glass-panel p-6">
    <div className="max-w-xl">
      <p className="dashboard-label">Profile</p>
      <h3 className="mt-2 text-xl font-bold text-[rgb(var(--text-primary))]">
        Secondary details stay out of the way
      </h3>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        Your account details are still here, but the workout flow stays first.
      </p>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <CompactInfo icon={<User size={16} />} label="Account" value={user?.name || "FitBuddy User"} />
      <CompactInfo icon={<Mail size={16} />} label="Email" value={user?.email || "No email available"} />
      <CompactInfo
        icon={<Activity size={16} />}
        label="Latest log"
        value={latestLogDate ? formatDisplayDate(latestLogDate) : "Open today's log"}
      />
    </div>

    <div className="dashboard-soft-panel mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-4">
      <div>
        <p className="dashboard-label">Weight sync</p>
        <p className="mt-1 text-sm font-semibold text-[rgb(var(--text-primary))]">
          {hasWeightToday ? "Today's weight is up to date." : "Add today's weight when you're ready."}
        </p>
      </div>
      <span className="dashboard-status-chip">
        {hasWeightToday ? "Weight updated" : "Weight pending"}
      </span>
    </div>
  </div>
);

export default AccountSummaryCard;