import { useState, useMemo, useEffect, lazy, Suspense } from "react";

const ExerciseInfo = lazy(() => import("../components/ExerciseInfo"));

export default function Blog() {
  const [search, setSearch] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [openedExercise, setOpenedExercise] = useState(null);

  useEffect(() => {
    fetch("./alljson/exercises.json")
      .then((res) => res.json())
      .then((data) => setExercises(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching exercises:", err));
  }, []);

  const filteredExercises = useMemo(() => {
    let size = 0;
    return exercises.filter((ex) => {
      const matchesSearch = ex.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesGoal = selectedGoal
        ? ex.TrainingGoals.includes(selectedGoal)
        : true;
      const matchesMethod = selectedMethod
        ? (Array.isArray(ex.TrainingMethod) && ex.TrainingMethod.includes(selectedMethod))
        : true;

      if (matchesSearch && matchesGoal && matchesMethod && size < 18) {
        size++;
        return true;
      }
      return false;
    });
  }, [exercises, search, selectedGoal, selectedMethod]);

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] text-[rgb(var(--text-primary))]">

      {/* Hero */}
      <section className="px-6 py-10 text-center mt-10">
        <h1 className="text-3xl font-bold">
          Explore Exercises & Fitness Guides
        </h1>
        <p className="mt-2 text-[rgb(var(--text-muted))]">
          Search exercises by goal, method or name
        </p>
      </section>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row justify-around gap-4 px-6">
        <input
          type="text"
          placeholder="Search exercise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full max-w-md bg-[rgb(var(--card-depth-1))] text-[rgb(var(--text-primary))]"
        />

        <select
          className="select w-full max-w-xs bg-[rgb(var(--card-depth-1))]"
          value={selectedGoal || ""}
          onChange={(e) =>
            setSelectedGoal(e.target.value === "" ? null : e.target.value)
          }
        >
          <option value="">All Goals</option>
          <option value="Fat Loss">Weight/Fat Loss</option>
          <option value="Muscle Gain">Strength/Muscle Gain</option>
          <option value="Endurance">Endurance</option>
          <option value="Mobility">Mobility</option>
          <option value="Physiotherapy">Physiotherapy</option>
        </select>

        <select
          className="select w-full max-w-xs bg-[rgb(var(--card-depth-1))]"
          value={selectedMethod || ""}
          onChange={(e) =>
            setSelectedMethod(e.target.value === "" ? null : e.target.value)
          }
        >
          <option value="">All Methods</option>
          <option value="Weighted">Weighted</option>
          <option value="Calisthenics">Calisthenics</option>
          <option value="Power Lifting">Power Lifting</option>
          <option value="Functional">Functional</option>
          <option value="Yoga">Yoga</option>
          <option value="Cardio">Cardio</option>
        </select>
      </div>

      {/* Exercise Grid */}
      <section className="px-6 pb-16 mt-10">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-[rgb(var(--text-muted))]">
            No exercises found
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="
                  rounded-lg
                  bg-[rgb(var(--card-depth-1))]
                  shadow-[0_2px_10px_rgba(0,0,0,0.25)]
                  hover:shadow-[0_6px_25px_rgba(0,0,0,0.4)]
                  transition
                "
              >
                <figure className="h-80 bg-[rgb(var(--card-depth-2))] rounded-t-lg">
                  <img
                    src={ex.media.image || ""}
                    alt={ex.title}
                    className="object-cover h-full w-full rounded-t-lg"
                  />
                </figure>

                <div className="p-4">
                  <h2 className="text-lg font-semibold">
                    {ex.title}
                  </h2>

                  <p className="mt-1 text-sm text-[rgb(var(--text-muted))] line-clamp-2">
                    {ex.description}
                  </p>

                  <div className="mt-4 flex justify-end">
                    <button
                      className="btn btn-sm"
                      onClick={() => setOpenedExercise(ex)}
                    >
                      View Exercise
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {openedExercise && (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ExerciseInfo
            ex={openedExercise}
            onClose={() => setOpenedExercise(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
