import { useEffect, useRef } from "react";

const ExerciseInfo = ({ ex, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();

    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="
        backdrop:bg-black/60
        bg-transparent
        p-0
        border-0
      "
    >
      {/* Center wrapper */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Modal Card */}
        <div
          className="
            w-full max-w-3xl
            max-h-[90vh]
            overflow-hidden
            rounded-2xl
            bg-[rgb(var(--card-depth-1))]
            text-[rgb(var(--text-primary))]
            shadow-2xl
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-black/10">
            <h3 className="text-xl font-bold">{ex.title}</h3>
            <span className="px-3 py-1 rounded-full text-sm bg-[rgb(var(--card-depth-2))]">
              {ex.difficulty}
            </span>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Image */}
            {ex.media?.image && (
              <img
                src={ex.media.image}
                alt={ex.title}
                className="w-full h-52 object-cover rounded-lg"
              />
            )}

            {/* Description */}
            <p className="text-[rgb(var(--text-muted))]">
              {ex.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {Array.isArray(ex.TrainingGoals) && ex.TrainingGoals.map(goal => (
                <span
                  key={goal}
                  className="px-2 py-1 text-xs rounded-md bg-[rgb(var(--card-depth-2))]"
                >
                  {goal}
                </span>
              ))}
              {Array.isArray(ex.TrainingMethod) && ex.TrainingMethod.map(method => (
                <span
                  key={method}
                  className="px-2 py-1 text-xs rounded-md border border-[rgb(var(--text-muted))] text-[rgb(var(--text-muted))]"
                >
                  {method}
                </span>
              ))}
            </div>

            {/* Muscles */}
            <div>
              <h4 className="font-semibold mb-1">Targeted Muscles</h4>
              <ul className="list-disc list-inside text-sm text-[rgb(var(--text-muted))]">
                {Array.isArray(ex.targetedMuscles) && ex.targetedMuscles.map(m => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>

            {/* Procedure */}
            <div>
              <h4 className="font-semibold mb-1">How to Perform</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 text-[rgb(var(--text-muted))]">
                {Array.isArray(ex.procedure) && ex.procedure.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Mistakes */}
            <div>
              <h4 className="font-semibold mb-1 text-red-500">
                Common Mistakes
              </h4>
              <ul className="list-disc list-inside text-sm text-[rgb(var(--text-muted))]">
                {Array.isArray(ex.commonMistakes) && ex.commonMistakes.map(m => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>

            {/* Extra Info */}
            <div className="flex justify-between text-sm text-[rgb(var(--text-muted))] pt-2">
              <span>🔥 {ex.estimatedCaloriesBurnedPerMinute} cal / min</span>
              <span>
                🏋️ Equipment:{" "}
                {Array.isArray(ex.equipmentRequired) && ex.equipmentRequired.length === 0
                  ? "None"
                  : Array.isArray(ex.equipmentRequired) ? ex.equipmentRequired.join(", ") : "None"}
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <form method="dialog" className="px-6 py-4 border-t border-black/10 text-right">
            <button className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition">
              Close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default ExerciseInfo;
