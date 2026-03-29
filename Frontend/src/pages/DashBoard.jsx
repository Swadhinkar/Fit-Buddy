import { useContext, useEffect, useState } from "react";
import {
  Activity,
  Calculator,
  CheckCircle,
  Dumbbell,
  Flame,
  Mail,
  Moon,
  PlusCircle,
  Trophy,
  User,
  Weight,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthContext";
import Heatmap from "../components/Heatmap";
import LogForm from "../components/LogForm";
import StreakCard from "../components/StreakCard";
import InjuryRiskCard from "../components/dashboard/InjuryRiskCard";
import WeightTrendChart from "../components/dashboard/WeightTrendChart";
import { getLogHistory, getTodayLog, updateTodayLog } from "../api/logApi";
import {
  buildHeatmapData,
  buildWeightSeries,
  calculateDailyVolume,
  calculateRisk,
  formatDateKey,
} from "../utils/workoutAnalytics";

const HISTORY_RANGE_DAYS = 180;
const HEATMAP_DAYS = 365;

const createEmptyExercise = () => ({
  name: "",
  sets: "",
  reps: "",
  weight: "",
});

const createEmptyLogForm = () => ({
  caloriesConsumed: "",
  exerciseTime: "",
  weight: "",
  exercises: [],
});

const mapLogToForm = (log) => ({
  caloriesConsumed: log?.caloriesConsumed?.toString() ?? "",
  exerciseTime: log?.exerciseTime?.toString() ?? "",
  weight: log?.weight === null || log?.weight === undefined ? "" : log.weight.toString(),
  exercises: Array.isArray(log?.exercises)
    ? log.exercises.map((exercise) => ({
        name: exercise.name ?? "",
        sets: exercise.sets?.toString() ?? "",
        reps: exercise.reps?.toString() ?? "",
        weight: exercise.weight?.toString() ?? "",
      }))
    : [],
});

const hasExerciseInput = (exercise = {}) =>
  [exercise?.name, exercise?.sets, exercise?.reps, exercise?.weight].some(
    (value) => value !== "" && value !== null && value !== undefined,
  );

const normalizeExercises = (exercises = []) =>
  exercises
    .filter((exercise) => hasExerciseInput(exercise))
    .map((exercise) => ({
      name: exercise.name.trim(),
      sets: Number(exercise.sets),
      reps: Number(exercise.reps),
      weight: Number(exercise.weight),
    }));

const validateExercises = (exercises = []) => {
  const hasInvalidExercise = exercises.some((exercise) => {
    if (!hasExerciseInput(exercise)) {
      return false;
    }

    const trimmedName = exercise.name.trim();
    const sets = Number(exercise.sets);
    const reps = Number(exercise.reps);
    const weight = Number(exercise.weight);

    return (
      !trimmedName ||
      !Number.isInteger(sets) ||
      sets <= 0 ||
      !Number.isInteger(reps) ||
      reps <= 0 ||
      !Number.isFinite(weight) ||
      weight < 0
    );
  });

  if (hasInvalidExercise) {
    return "Complete each exercise with a name, whole-number sets and reps, and a non-negative weight.";
  }

  return "";
};

const normalizePayload = (formData) => ({
  caloriesConsumed: formData.caloriesConsumed === "" ? 0 : Number(formData.caloriesConsumed),
  exerciseTime: formData.exerciseTime === "" ? 0 : Number(formData.exerciseTime),
  weight: formData.weight === "" ? "" : Number(formData.weight),
  exercises: normalizeExercises(formData.exercises),
});

const hasWorkoutRecord = (log) =>
  Boolean(
    log &&
      (Boolean(log.didExercise) ||
        Number(log.exerciseTime) > 0 ||
        (Array.isArray(log.exercises) && log.exercises.length > 0)),
  );

const calculateWorkoutStreak = (logs) => {
  const logMap = new Map(logs.map((log) => [log.date, log]));
  const today = new Date();
  let streak = 0;

  for (let offset = 0; offset < logs.length + 1; offset += 1) {
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(today.getDate() - offset);

    const formattedDate = formatDateKey(currentDate);
    const log = logMap.get(formattedDate);

    if (!hasWorkoutRecord(log)) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const formatLoad = (value) => Math.round(value || 0).toLocaleString();

export default function PersonalDashboard() {
  const { user } = useContext(AuthContext);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isFetchingLog, setIsFetchingLog] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [logError, setLogError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [logHistory, setLogHistory] = useState([]);
  const [streakCount, setStreakCount] = useState(0);
  const [todayLog, setTodayLog] = useState(null);
  const [formData, setFormData] = useState(createEmptyLogForm());

  useEffect(() => {
    if (todayLog) {
      setFormData(mapLogToForm(todayLog));
    }
  }, [todayLog]);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsDashboardLoading(true);
      setIsHistoryLoading(true);
      setDashboardError("");
      setHistoryError("");

      try {
        const [todayResult, historyResult] = await Promise.allSettled([
          getTodayLog(),
          getLogHistory(HISTORY_RANGE_DAYS),
        ]);

        if (todayResult.status === "fulfilled") {
          setTodayLog(todayResult.value);
        } else {
          const message =
            todayResult.reason?.response?.data?.error ||
            "Failed to load today's log. You can still review your recent history.";
          setDashboardError(message);
        }

        if (historyResult.status === "fulfilled") {
          setLogHistory(Array.isArray(historyResult.value) ? historyResult.value : []);
        } else {
          const message =
            historyResult.reason?.response?.data?.error ||
            "Failed to load workout history. Your streak and analytics may be unavailable.";
          setHistoryError(message);
        }
      } finally {
        setIsDashboardLoading(false);
        setIsHistoryLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    setStreakCount(calculateWorkoutStreak(logHistory));
  }, [logHistory]);

  useEffect(() => {
    if (!isLogModalOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLogModalOpen]);

  const openLogModal = async () => {
    setIsLogModalOpen(true);
    setIsFetchingLog(true);
    setLogError("");

    try {
      const log = await getTodayLog();
      setTodayLog(log);
      setFormData(log ? mapLogToForm(log) : createEmptyLogForm());
    } catch (error) {
      const message =
        error?.response?.data?.error || "Failed to load today's log. Please try again.";
      setLogError(message);
      setFormData(todayLog ? mapLogToForm(todayLog) : createEmptyLogForm());
    } finally {
      setIsFetchingLog(false);
    }
  };

  const closeLogModal = () => {
    if (isSubmittingLog) {
      return;
    }

    setIsLogModalOpen(false);
    setLogError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddExercise = () => {
    setFormData((current) => ({
      ...current,
      exercises: [...current.exercises, createEmptyExercise()],
    }));
  };

  const handleExerciseChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise,
      ),
    }));
  };

  const handleRemoveExercise = (index) => {
    setFormData((current) => ({
      ...current,
      exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const exerciseValidationMessage = validateExercises(formData.exercises);

    if (exerciseValidationMessage) {
      setLogError(exerciseValidationMessage);
      return;
    }

    const payload = normalizePayload(formData);
    const previousLog = todayLog;
    const optimisticLog = {
      ...todayLog,
      ...payload,
      didExercise: payload.exerciseTime > 0 || payload.exercises.length > 0,
      date: todayLog?.date || formatDateKey(new Date()),
    };

    setIsSubmittingLog(true);
    setLogError("");
    setTodayLog(optimisticLog);

    try {
      const updatedLog = await updateTodayLog(payload);
      setLogHistory((current) => {
        const next = current.filter((log) => log.date !== updatedLog.date);
        return [...next, updatedLog].sort((left, right) => left.date.localeCompare(right.date));
      });
      setTodayLog(updatedLog);
      setIsLogModalOpen(false);
      toast.success("Today's log updated");
    } catch (error) {
      setTodayLog(previousLog);
      setLogError(error?.response?.data?.error || "Failed to save today's log. Please try again.");
      toast.error("Unable to update today's log");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const hasLog = Boolean(todayLog);
  const workedOutToday = hasWorkoutRecord(todayLog);
  const todayWorkoutVolume = calculateDailyVolume(todayLog?.exercises ?? []);
  const todayExercises = Array.isArray(todayLog?.exercises) ? todayLog.exercises : [];
  const heatmapData = buildHeatmapData(logHistory, HEATMAP_DAYS);
  const weightSeries = buildWeightSeries(logHistory);
  const risk = calculateRisk(logHistory);

  return (
    <>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[rgb(var(--body-color))] px-4 pb-12 pt-24 text-[rgb(var(--text-primary))] transition-colors duration-300 md:px-10">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fitness Command Center</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              Track daily recovery, lifting volume, body weight, and 90-day consistency in one place.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={openLogModal}
              disabled={isFetchingLog}
              className="flex items-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[rgb(var(--primary))]/20 transition-all hover:bg-[rgb(var(--primary-hover))] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusCircle size={18} />
              {isFetchingLog ? "Loading..." : "Log Today"}
            </button>
          </div>
        </header>

        {dashboardError ? (
          <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {dashboardError}
          </div>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4 max-w-full">
          <StatCard
            title="Calories Consumed"
            value={hasLog ? todayLog.caloriesConsumed : isDashboardLoading ? "..." : "--"}
            unit="kcal"
            trend={hasLog ? "Updated today" : isDashboardLoading ? "Loading" : "No log yet"}
            color="var(--primary)"
          />
          <StatCard
            title="Exercise Time"
            value={hasLog ? todayLog.exerciseTime : isDashboardLoading ? "..." : "--"}
            unit="min"
            trend={hasLog ? "Today" : isDashboardLoading ? "Loading" : "No log yet"}
            color="var(--secondary)"
          />
          <StatCard
            title="Workout Status"
            value={hasLog ? (workedOutToday ? "Yes" : "Rest") : isDashboardLoading ? "..." : "--"}
            unit=""
            trend={hasLog ? "Minutes or lifts logged" : isDashboardLoading ? "Loading" : "No log yet"}
            color="var(--accent)"
          />
          <StatCard
            title="Current Weight"
            value={
              hasLog && todayLog.weight !== null && todayLog.weight !== undefined
                ? todayLog.weight
                : isDashboardLoading
                  ? "..."
                  : "--"
            }
            unit={hasLog && todayLog.weight !== null && todayLog.weight !== undefined ? "kg" : ""}
            trend={hasLog ? "Latest entry" : isDashboardLoading ? "Loading" : "No log yet"}
            color="var(--primary)"
          />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[rgb(var(--primary))] via-[rgb(var(--primary-hover))] to-[rgb(var(--secondary-hover))] p-8 text-white shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-all group-hover:bg-white/20" />

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-inner ring-2 ring-white/30 backdrop-blur-md">
                  <User size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold tracking-wide">{user?.name || "FitBuddy User"}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm opacity-80">
                  <Mail size={14} /> {user?.email || "No email available"}
                </p>

                <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Log Date</p>
                    <p className="font-bold">{todayLog?.date || "Open today's log"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Workout</p>
                    <p className="font-bold">
                      {hasLog ? (workedOutToday ? "Completed" : "Rest day") : "Not logged"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--secondary))]">
                    Today&apos;s Snapshot
                  </p>
                  <h3 className="mt-2 text-lg font-bold">Your latest numbers</h3>
                </div>
                <CheckCircle className="text-[rgb(var(--secondary))]" size={20} />
              </div>

              <div className="mt-5 space-y-3">
                <FocusItem
                  label="Calories"
                  value={hasLog ? `${todayLog.caloriesConsumed} kcal` : "Open the log form"}
                  icon={<Flame size={16} />}
                  color="var(--primary)"
                />
                <FocusItem
                  label="Exercise"
                  value={hasLog ? `${todayLog.exerciseTime} minutes` : "No workout logged"}
                  icon={<Dumbbell size={16} />}
                />
                <FocusItem
                  label="Volume"
                  value={todayExercises.length ? `${formatLoad(todayWorkoutVolume)} total load` : "No lifting entries"}
                  icon={<Activity size={16} />}
                  color="var(--secondary)"
                />
                <FocusItem
                  label="Weight"
                  value={
                    hasLog && todayLog.weight !== null && todayLog.weight !== undefined
                      ? `${todayLog.weight} kg`
                      : "Weight not added"
                  }
                  icon={<Weight size={16} />}
                  color="var(--accent)"
                />
              </div>
            </Card>

            <StreakCard streakCount={streakCount} isLoading={isHistoryLoading} />

            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<Calculator />} label="BMI Calc" sub="Check index" />
              <ActionButton icon={<Flame />} label="Nutrition" sub="Track meals" />
              <ActionButton icon={<Dumbbell />} label="Progress" sub="Log lifts" />
              <ActionButton icon={<Trophy />} label="Badges" sub="View all" />
            </div>
          </div>

          <div className="space-y-8 lg:col-span-8">
            <Heatmap data={heatmapData} isLoading={isHistoryLoading} error={historyError} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <InjuryRiskCard risk={risk} />
              <WeightTrendChart data={weightSeries} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Dumbbell size={20} className="text-[rgb(var(--primary))]" /> Today&apos;s Exercises
                </h3>

                {todayExercises.length ? (
                  <div className="space-y-3">
                    {todayExercises.map((exercise) => (
                      <div
                        key={`${exercise.name}-${exercise.sets}-${exercise.reps}-${exercise.weight}`}
                        className="rounded-2xl border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-1))/0.3] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{exercise.name}</p>
                            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                              {exercise.sets} sets x {exercise.reps} reps
                            </p>
                          </div>
                          <span className="rounded-full bg-[rgb(var(--primary))]/10 px-3 py-1 text-xs font-semibold text-[rgb(var(--primary))]">
                            {exercise.weight} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-[rgb(var(--card-depth-2))] bg-[rgb(var(--card-depth-1))/0.25] px-4 py-10 text-center">
                    <p className="text-sm font-medium">No exercise sets logged today.</p>
                    <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                      Add exercises in the daily log to unlock load-based analytics.
                    </p>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Moon size={20} className="text-[rgb(var(--accent))]" /> Recovery Focus
                </h3>
                <div className="space-y-3">
                  <FocusItem
                    label="Workout"
                    value={hasLog ? `${todayLog.exerciseTime} minutes logged` : "Log your session"}
                    icon={<Dumbbell size={16} />}
                  />
                  <FocusItem
                    label="Load"
                    value={todayExercises.length ? `${formatLoad(todayWorkoutVolume)} total load` : "No lifting volume yet"}
                    icon={<Activity size={16} />}
                    color="var(--secondary)"
                  />
                  <FocusItem
                    label="Recovery"
                    value={
                      workedOutToday
                        ? `Current risk is ${risk.level.toLowerCase()}. Review recovery if the score rises.`
                        : "Rest day logged. Keep sleep and hydration consistent."
                    }
                    icon={<Moon size={16} />}
                    color="var(--accent)"
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LogForm
        isOpen={isLogModalOpen}
        formData={formData}
        error={logError}
        isFetching={isFetchingLog}
        isSubmitting={isSubmittingLog}
        onAddExercise={handleAddExercise}
        onChange={handleInputChange}
        onClose={closeLogModal}
        onExerciseChange={handleExerciseChange}
        onRemoveExercise={handleRemoveExercise}
        onSubmit={handleSubmit}
      />
    </>
  );
}

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-[2rem] border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-6 shadow-xl shadow-black/[0.02] transition-all dark:shadow-none ${className}`}
  >
    {children}
  </div>
);

const StatCard = ({ title, value, unit, trend, color }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-6 shadow-sm transition-all duration-500 hover:shadow-lg">
    <div
      className="absolute left-0 top-0 h-1 w-full opacity-40 transition-opacity group-hover:opacity-100"
      style={{ backgroundColor: `rgb(${color})` }}
    />
    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest opacity-50">{title}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black tracking-tight" style={{ color: `rgb(${color})` }}>
        {value}
      </span>
      {unit ? <span className="text-xs font-bold opacity-40">{unit}</span> : null}
    </div>
    <div className="mt-4 flex items-center justify-between">
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          trend === "No log yet"
            ? "bg-[rgb(var(--card-depth-2))] opacity-60"
            : "bg-[rgb(var(--secondary))]/10 text-[rgb(var(--secondary))]"
        }`}
      >
        {trend}
      </span>
      <Activity size={16} className="opacity-10" />
    </div>
  </div>
);

const ActionButton = ({ icon, label, sub }) => (
  <button className="group flex w-full flex-col items-start rounded-2xl border border-[rgb(var(--card-depth-1))] bg-[rgb(var(--card-depth-0))] p-4 transition-all hover:-translate-y-1 hover:border-[rgb(var(--secondary))]">
    <div className="mb-3 rounded-xl bg-[rgb(var(--card-depth-1))] p-2 text-[rgb(var(--primary))] transition-colors group-hover:bg-[rgb(var(--secondary))] group-hover:text-white">
      {icon}
    </div>
    <span className="text-sm font-bold">{label}</span>
    <span className="text-[10px] font-medium opacity-50">{sub}</span>
  </button>
);

const FocusItem = ({ label, value, icon, color = "var(--secondary)" }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-transparent bg-[rgb(var(--card-depth-1))] p-3 transition-all hover:border-[rgb(var(--card-depth-2))]">
    <div
      className="rounded-xl bg-[rgb(var(--card-depth-0))] p-2.5 shadow-sm"
      style={{ color: `rgb(${color})` }}
    >
      {icon}
    </div>
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase leading-none opacity-40">{label}</p>
      <p className="text-sm font-bold tracking-tight">{value}</p>
    </div>
  </div>
);
