import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Scale } from "lucide-react";
import { formatCompactDate, formatDisplayDate } from "../../utils/workoutAnalytics";

const renderTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
        {formatDisplayDate(label)}
      </p>
      <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {payload[0].value} kg
      </p>
    </div>
  );
};

export default function WeightTrendChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="rounded-[2rem] border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--primary))]">
          Weight Trend
        </p>
        <h3 className="mt-2 text-xl font-bold">Body weight over time</h3>
        <div className="mt-6 rounded-3xl border border-dashed border-[rgb(var(--card-depth-2))] bg-[rgb(var(--card-depth-1))/0.3] px-4 py-12 text-center">
          <Scale size={24} className="mx-auto text-[rgb(var(--primary))]" />
          <p className="mt-3 text-sm font-medium text-[rgb(var(--text-primary))]">
            No weight logs available yet.
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            Add your body weight in the daily log to unlock the trend chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--primary))]">
            Weight Trend
          </p>
          <h3 className="mt-2 text-xl font-bold">Body weight over time</h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            A smooth line based on your saved weight entries only.
          </p>
        </div>

        <div className="rounded-2xl bg-[rgb(var(--card-depth-1))/0.45] p-3 text-[rgb(var(--primary))]">
          <Scale size={20} />
        </div>
      </div>

      <div className="mt-6 h-72 w-full rounded-3xl bg-[rgb(var(--card-depth-1))/0.3] px-3 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
            {/* <CartesianGrid stroke="rgb(var(--card-depth-1))" strokeDasharray="4 4" vertical={false} /> */}
            <XAxis
              dataKey="date"
              tickFormatter={formatDisplayDateTick}
              minTickGap={28}
              tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={44}
              tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip content={renderTooltip} />
            {/* <Line
              type="monotone"
              dataKey="weight"
              stroke="rgb(var(--primary))"
              strokeWidth={2}
              dot={renderDot(data.length - 1)}
              activeDot={{ r: 5, fill: "rgb(var(--primary))", stroke: "rgb(var(--card-depth-0))", strokeWidth: 2 }}
            /> */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="rgb(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: "rgb(var(--primary))",
                stroke: "rgb(var(--card-depth-0))",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatDisplayDateTick(value) {
  return formatCompactDate(value);
}
