const StatCard = ({ title, value, unit, trend, color, icon }) => (
  <div className="dashboard-card dashboard-card-hover glass-panel h-full p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="dashboard-label">{title}</p>
        <div className="mt-3 flex items-end gap-1">
          <span className="text-3xl font-black tracking-tight" style={{ color: `rgb(${color})` }}>
            {value}
          </span>
          {unit ? (
            <span className="pb-1 text-xs font-semibold text-[rgb(var(--text-muted))]">{unit}</span>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-2xl bg-[rgb(var(--card-depth-1))/0.4] p-3"
        style={{ color: `rgb(${color})` }}
      >
        {icon}
      </div>
    </div>

    <div className="mt-5 border-t border-[rgb(var(--card-depth-1))] pt-4">
      <span className="text-sm font-medium text-[rgb(var(--text-muted))]">{trend}</span>
    </div>
  </div>
);

export default StatCard;