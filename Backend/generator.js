import fs from "fs";

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateYearData() {
  const data = [];

  let currentWeight = 65;
  let date = new Date("2026-01-01");

  for (let i = 0; i < 365; i++) {
    const didExercise = Math.random() > 0.25; // 75% consistency

    const calories = didExercise
      ? randomBetween(2000, 2600)
      : randomBetween(2600, 3200);

    const exerciseTime = didExercise ? randomBetween(20, 60) : 0;

    // weight fluctuation
    if (didExercise) {
      currentWeight -= Math.random() * 0.05;
    } else {
      currentWeight += Math.random() * 0.08;
    }

    currentWeight = parseFloat(currentWeight.toFixed(1));

    // 🔥 RISK LOGIC (KEY PART FOR INTERVIEW)
    let riskScore = 20;

    if (!didExercise) riskScore += 30;
    if (calories > 2800) riskScore += 20;
    if (exerciseTime < 20 && didExercise) riskScore += 10;

    // occasional spikes (simulate bad weeks)
    if (Math.random() < 0.1) {
      riskScore += randomBetween(20, 30);
    }

    riskScore = Math.min(85, Math.max(15, riskScore));

    const log = {
      userId: "USER_ID_HERE",
      date: date.toISOString().split("T")[0],
      caloriesConsumed: calories,
      exerciseTime,
      didExercise,
      weight: currentWeight,
      riskScore,
      exercises: didExercise
        ? [
            {
              name: "Push Up",
              sets: randomBetween(2, 4),
              reps: randomBetween(8, 15),
              weight: 0,
            },
          ]
        : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.push(log);

    // next day
    date.setDate(date.getDate() + 1);
  }

  return data;
}

const logs = generateYearData();

fs.writeFileSync("fitness_logs.json", JSON.stringify(logs, null, 2));

console.log("✅ Generated 1 year realistic fitness logs!");