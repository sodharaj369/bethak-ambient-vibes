import { SCENES, type MoodId } from "@/data/scenes";

/**
 * A very quiet row of four words. No cards, no dashboard — just the moods.
 */
export function MoodSelector({
  mood,
  onChange,
}: {
  mood: MoodId;
  onChange: (id: MoodId) => void;
}) {
  return (
    <div className="mood-row" role="group" aria-label="Bethak ka mood">
      {SCENES.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`mood-word${s.id === mood ? " mood-word-on" : ""}`}
          aria-pressed={s.id === mood}
          title={s.name}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
