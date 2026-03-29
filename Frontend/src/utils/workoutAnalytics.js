const DAY_IN_MS = 24 * 60 * 60 * 1000;

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short" });
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MUSCLE_GROUP_PATTERNS = [
  {
    group: "Chest",
    keywords: ["bench press", "chest", "push up", "push-up", "dip", "pec", "fly"],
  },
  {
    group: "Back",
    keywords: ["row", "pull up", "pull-up", "chin up", "chin-up", "lat", "deadlift", "back"],
  },
  {
    group: "Shoulders",
    keywords: ["shoulder", "overhead press", "military press", "lateral raise", "front raise", "arnold press"],
  },
  {
    group: "Biceps",
    keywords: ["curl", "bicep", "hammer curl", "preacher curl"],
  },
  {
    group: "Triceps",
    keywords: ["tricep", "skull crusher", "pushdown", "close grip", "close-grip", "overhead extension"],
  },
  {
    group: "Quads",
    keywords: ["squat", "leg press", "lunge", "split squat", "step up", "step-up", "quad"],
  },
  {
    group: "Hamstrings",
    keywords: ["romanian deadlift", "rdl", "hamstring", "leg curl", "good morning"],
  },
  {
    group: "Glutes",
    keywords: ["hip thrust", "glute", "bridge", "kickback"],
  },
  {
    group: "Calves",
    keywords: ["calf raise", "calves", "seated calf", "standing calf"],
  },
  {
    group: "Core",
    keywords: ["plank", "crunch", "sit up", "sit-up", "leg raise", "ab wheel", "core", "twist"],
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sumValues = (values = []) => values.reduce((total, value) => total + value, 0);

const isFiniteNumber = (value) => Number.isFinite(value);

const getExerciseWeight = (exercise = {}) => {
  const weight = Number(exercise.weight);
  return isFiniteNumber(weight) ? weight : 0;
};

const getExerciseSets = (exercise = {}) => {
  const sets = Number(exercise.sets);
  return Number.isInteger(sets) && sets > 0 ? sets : 0;
};

const getExerciseReps = (exercise = {}) => {
  const reps = Number(exercise.reps);
  return Number.isInteger(reps) && reps > 0 ? reps : 0;
};

const buildWorkoutEntry = (workout = {}) => {
  const dateObject = parseDateKey(workout.date);
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  const volume = calculateDailyVolume(exercises);
  const exerciseTime = Number(workout.exerciseTime) || 0;
  const hasWorkout = volume > 0 || exerciseTime > 0 || Boolean(workout.didExercise);
  const muscleGroups = Array.from(
    new Set(exercises.flatMap((exercise) => getMuscleGroupsForExercise(exercise.name))),
  );

  return {
    ...workout,
    date: workout.date,
    dateObject,
    exercises,
    exerciseTime,
    hasWorkout,
    volume,
    muscleGroups,
  };
};

const getDayDifference = (laterDate, earlierDate) => {
  if (!(laterDate instanceof Date) || Number.isNaN(laterDate.getTime())) {
    return Number.NaN;
  }

  if (!(earlierDate instanceof Date) || Number.isNaN(earlierDate.getTime())) {
    return Number.NaN;
  }

  const utcLater = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate());
  const utcEarlier = Date.UTC(
    earlierDate.getFullYear(),
    earlierDate.getMonth(),
    earlierDate.getDate(),
  );

  return Math.round((utcLater - utcEarlier) / DAY_IN_MS);
};

const getStartOfWeek = (dateValue) => {
  const date = parseDateKey(dateValue);

  if (!date) {
    return null;
  }

  const startOfWeek = new Date(date);
  const adjustedDay = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - adjustedDay);
  return startOfWeek;
};

const getHeatmapIntensity = (value, maxValue) => {
  if (value <= 0) {
    return 0;
  }

  if (maxValue <= 0) {
    return 1;
  }

  const ratio = value / maxValue;

  if (ratio >= 0.8) {
    return 4;
  }

  if (ratio >= 0.55) {
    return 3;
  }

  if (ratio >= 0.25) {
    return 2;
  }

  return 1;
};

const getConsecutiveWorkoutDays = (workouts = []) => {
  if (!workouts.length) {
    return 0;
  }

  let streak = 1;

  for (let index = workouts.length - 1; index > 0; index -= 1) {
    const currentWorkout = workouts[index];
    const previousWorkout = workouts[index - 1];
    const gap = getDayDifference(currentWorkout.dateObject, previousWorkout.dateObject);

    if (gap !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const getRecentMuscleFrequency = (workouts = [], referenceDate) => {
  const frequencyByMuscle = new Map();

  workouts.forEach((workout) => {
    const difference = getDayDifference(referenceDate, workout.dateObject);

    if (difference < 0 || difference > 4) {
      return;
    }

    workout.muscleGroups.forEach((group) => {
      const dateSet = frequencyByMuscle.get(group) ?? new Set();
      dateSet.add(workout.date);
      frequencyByMuscle.set(group, dateSet);
    });
  });

  return Array.from(frequencyByMuscle.entries())
    .filter(([, dateSet]) => dateSet.size >= 4)
    .map(([group]) => group);
};

const getSuddenWeightJumpExercises = (workouts = []) => {
  if (workouts.length < 2) {
    return [];
  }

  const latestWorkout = workouts[workouts.length - 1];
  const previousWeights = new Map();

  workouts.slice(0, -1).forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const exerciseName = exercise.name?.trim().toLowerCase();
      const weight = getExerciseWeight(exercise);

      if (!exerciseName || weight <= 0) {
        return;
      }

      previousWeights.set(exerciseName, weight);
    });
  });

  return latestWorkout.exercises.reduce((jumpExercises, exercise) => {
    const exerciseName = exercise.name?.trim().toLowerCase();
    const currentWeight = getExerciseWeight(exercise);

    if (!exerciseName || currentWeight <= 0) {
      return jumpExercises;
    }

    const previousWeight = previousWeights.get(exerciseName);

    if (previousWeight && currentWeight > previousWeight * 1.2) {
      jumpExercises.push(exercise.name.trim());
    }

    return jumpExercises;
  }, []);
};

const getRiskLevel = (riskScore) => {
  if (riskScore <= 30) {
    return "Low";
  }

  if (riskScore <= 60) {
    return "Medium";
  }

  if (riskScore <= 80) {
    return "High";
  }

  return "Critical";
};

const estimateDailyRiskScore = (log = {}) => {
  if (!log || !log.hasWorkout) {
    return 0;
  }

  if (Number.isFinite(log?.riskScore)) {
    return Math.min(100, Math.max(0, Number(log.riskScore)));
  }

  const volume = Number(log.volume) || 0;
  const exerciseTime = Number(log.exerciseTime) || 0;
  const exerciseCount = Array.isArray(log.exercises) ? log.exercises.length : 0;

  const volumeScore = Math.min(50, Math.round((volume / 6000) * 50));
  const timeScore = Math.min(30, Math.round((exerciseTime / 120) * 30));
  const countScore = Math.min(20, exerciseCount * 3);

  return Math.min(100, Math.max(0, volumeScore + timeScore + countScore));
};

const formatReasonList = (items = []) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

export const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const [year, month, day] = String(value)
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

export const formatDisplayDate = (dateValue) => {
  const date = parseDateKey(dateValue);
  return date ? FULL_DATE_FORMATTER.format(date) : "No date";
};

export const formatCompactDate = (dateValue) => {
  const date = parseDateKey(dateValue);
  return date ? SHORT_DATE_FORMATTER.format(date) : "";
};

export const calculateWeekIndex = (dateValue, startDateValue) => {
  const date = parseDateKey(dateValue);
  const gridStartDate = getStartOfWeek(startDateValue);

  if (!date || !gridStartDate) {
    return 0;
  }

  return Math.floor(getDayDifference(date, gridStartDate) / 7);
};

export const calculateDailyVolume = (exercises = []) =>
  exercises.reduce((totalVolume, exercise) => {
    const sets = getExerciseSets(exercise);
    const reps = getExerciseReps(exercise);
    const weight = getExerciseWeight(exercise);

    return totalVolume + sets * reps * weight;
  }, 0);

export const getMuscleGroupsForExercise = (exerciseName = "") => {
  const normalizedName = exerciseName.trim().toLowerCase();

  if (!normalizedName) {
    return [];
  }

  return MUSCLE_GROUP_PATTERNS.reduce((groups, pattern) => {
    const matchesGroup = pattern.keywords.some((keyword) => normalizedName.includes(keyword));

    if (matchesGroup) {
      groups.push(pattern.group);
    }

    return groups;
  }, []);
};

export const calculateRisk = (workouts = []) => {
  const workoutEntries = workouts
    .map(buildWorkoutEntry)
    .filter((workout) => workout.dateObject)
    .sort((left, right) => left.date.localeCompare(right.date));

  const activeWorkouts = workoutEntries.filter((workout) => workout.hasWorkout);
  const detailedWorkouts = activeWorkouts.filter((workout) => workout.exercises.length > 0);

  if (!activeWorkouts.length) {
    return {
      riskScore: 0,
      level: "Low",
      reasons: ["Not enough recorded workout history to flag elevated injury risk yet."],
    };
  }

  const latestWorkout = activeWorkouts[activeWorkouts.length - 1];
  const referenceDate = latestWorkout.dateObject;
  const nonZeroVolumes = workoutEntries.map((workout) => workout.volume).filter((volume) => volume > 0);
  const averageVolume = nonZeroVolumes.length
    ? sumValues(nonZeroVolumes) / nonZeroVolumes.length
    : 0;
  const currentWeekVolume = sumValues(
    workoutEntries
      .filter((workout) => {
        const difference = getDayDifference(referenceDate, workout.dateObject);
        return difference >= 0 && difference <= 6;
      })
      .map((workout) => workout.volume),
  );
  const previousWeekVolume = sumValues(
    workoutEntries
      .filter((workout) => {
        const difference = getDayDifference(referenceDate, workout.dateObject);
        return difference >= 7 && difference <= 13;
      })
      .map((workout) => workout.volume),
  );
  const consecutiveWorkoutDays = getConsecutiveWorkoutDays(activeWorkouts);
  const overusedMuscleGroups = getRecentMuscleFrequency(detailedWorkouts, referenceDate);
  const suddenWeightJumpExercises = getSuddenWeightJumpExercises(detailedWorkouts);

  let riskScore = 0;
  const reasons = [];

  if (previousWeekVolume > 0) {
    if (currentWeekVolume > previousWeekVolume * 1.5) {
      riskScore += 40;
      reasons.push("Weekly load is more than 50% above the previous 7-day block.");
    } else if (currentWeekVolume > previousWeekVolume * 1.3) {
      riskScore += 25;
      reasons.push("Weekly load is more than 30% above the previous 7-day block.");
    }
  }

  if (consecutiveWorkoutDays >= 6) {
    riskScore += 30;
    reasons.push(`${consecutiveWorkoutDays} consecutive workout days were logged.`);
  } else if (consecutiveWorkoutDays >= 4) {
    riskScore += 15;
    reasons.push(`${consecutiveWorkoutDays} consecutive workout days increase recovery pressure.`);
  }

  if (overusedMuscleGroups.length > 0) {
    riskScore += 20;
    reasons.push(
      `${formatReasonList(overusedMuscleGroups)} were trained at least 4 times in the last 5 days.`,
    );
  }

  if (averageVolume > 0 && latestWorkout.volume > averageVolume * 1.5) {
    riskScore += 20;
    reasons.push("Today's lifting volume is well above your usual daily average.");
  }

  if (suddenWeightJumpExercises.length > 0) {
    riskScore += 15;
    reasons.push(
      `${formatReasonList(
        suddenWeightJumpExercises.slice(0, 3),
      )} jumped by more than 20% in load versus the previous logged session.`,
    );
  }

  const clampedRiskScore = clamp(riskScore, 0, 100);

  return {
    riskScore: clampedRiskScore,
    level: getRiskLevel(clampedRiskScore),
    reasons:
      reasons.length > 0
        ? reasons
        : ["No elevated injury indicators were detected from your recorded workouts."],
  };
};

export const buildWeightSeries = (logs = []) =>
  logs.reduce((series, log) => {
    if (log?.weight === null || log?.weight === undefined || log.weight === "") {
      return series;
    }

    const weight = Number(log?.weight);

    if (!isFiniteNumber(weight)) {
      return series;
    }

    const date = parseDateKey(log.date);

    if (!date) {
      return series;
    }

    series.push({
      date: log.date,
      label: formatCompactDate(log.date),
      weight,
    });

    return series;
  }, []);

export const buildHeatmapData = (logs = [], totalDays = 365) => {
  const days = Math.max(totalDays, 365);
  const today = parseDateKey(new Date());
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));

  const normalizedLogs = logs
    .map(buildWorkoutEntry)
    .filter((log) => log.dateObject)
    .sort((left, right) => left.date.localeCompare(right.date));

  const logMap = new Map(normalizedLogs.map((log) => [log.date, log]));
  const gridStartDate = getStartOfWeek(startDate);
  const totalColumns = calculateWeekIndex(today, startDate) + 1;
  const intensityValues = [];
  const activeDates = new Set();

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);

    const dateKey = formatDateKey(date);
    const log = logMap.get(dateKey);
    const isActive = Boolean(log?.hasWorkout);
    const intensityValue = log?.volume > 0 ? log.volume : log?.exerciseTime ?? 0;

    if (isActive) {
      activeDates.add(dateKey);
      intensityValues.push(intensityValue);
    }
  }

  const maxIntensityValue = Math.max(...intensityValues, 0);
  const cells = [];
  const monthLabels = Array.from({ length: totalColumns }, () => "");
  let previousLabeledMonth = -1;

  for (let columnIndex = 0; columnIndex < totalColumns; columnIndex += 1) {
    for (let rowIndex = 0; rowIndex < 7; rowIndex += 1) {
      const date = new Date(gridStartDate);
      date.setDate(gridStartDate.getDate() + columnIndex * 7 + rowIndex);

      const inRange = date >= startDate && date <= today;
      const dateKey = formatDateKey(date);
      const log = inRange ? logMap.get(dateKey) ?? null : null;
      const adjustedDay = (date.getDay() + 6) % 7;
      const intensityValue = log?.volume > 0 ? log.volume : log?.exerciseTime ?? 0;
      const intensity = inRange ? getHeatmapIntensity(intensityValue, maxIntensityValue) : 0;

      cells.push({
        key: `${dateKey}-${columnIndex}-${rowIndex}`,
        date: inRange ? dateKey : null,
        row: adjustedDay,
        column: columnIndex,
        intensity,
        intensityValue,
        isActive: Boolean(log?.hasWorkout),
        riskScore: log && Number.isFinite(log.riskScore) ? Number(log.riskScore) : estimateDailyRiskScore(log),
        log,
      });
    }

    const weekStart = new Date(gridStartDate);
    weekStart.setDate(gridStartDate.getDate() + columnIndex * 7);
    const firstVisibleDate = Array.from({ length: 7 }, (_, dayOffset) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayOffset);
      return date;
    }).find((date) => date >= startDate && date <= today);

    if (firstVisibleDate && (columnIndex === 0 || firstVisibleDate.getMonth() !== previousLabeledMonth)) {
      monthLabels[columnIndex] = MONTH_LABEL_FORMATTER.format(firstVisibleDate);
      previousLabeledMonth = firstVisibleDate.getMonth();
    }
  }

  return {
    cells,
    columns: totalColumns,
    rows: 7,
    monthLabels,
    activeDays: activeDates.size,
  };
};
