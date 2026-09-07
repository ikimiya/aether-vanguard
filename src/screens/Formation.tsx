import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGameData } from "../game-data/GameDataProvider";
import { useRequiredUserId } from "../auth/useSession";
import { getCharacter, tryGetCharacter } from "../game/data/characters";
import { RARITIES } from "../game/data/gacha/rarities";
import { ELEMENT_COLORS } from "../game/data/elements";
import { ACTIVE_SLOTS, TEAM_SIZE, resolveTeam } from "../game/party";
import { saveFormation } from "../lib/db/profile";
import { assetUrl } from "../ui/assets";

function SlotCard({
  characterKey,
  index,
  onRemove,
}: {
  characterKey: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: characterKey });
  const c = getCharacter(characterKey);
  const active = index < ACTIVE_SLOTS;

  return (
    <div
      ref={setNodeRef}
      className="card card--framed"
      {...attributes}
      {...listeners}
      style={{
        "--rarity": RARITIES[c.rarity].color,
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 5 : undefined,
        boxShadow: isDragging ? "var(--shadow-2)" : undefined,
        opacity: isDragging ? 0.95 : 1,
      } as React.CSSProperties}
    >
      <div className="card__meta" style={{ marginBottom: "var(--s-1)" }}>
        {active ? `Active ${index + 1}` : "Bench"}
      </div>
      <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} draggable={false} />
      <div className="card__name">{c.name}</div>
      <button
        className="btn--ghost btn--sm"
        style={{ marginTop: "var(--s-2)" }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      >
        ✕ Remove
      </button>
    </div>
  );
}

export function Formation() {
  const userId = useRequiredUserId();
  const { roster, formation, reload } = useGameData();
  const owned = useMemo(
    () => (roster ?? []).filter((o) => tryGetCharacter(o.character_key)),
    [roster],
  );
  const saved = useMemo(() => formation ?? [], [formation]);

  const [draft, setDraft] = useState<string[]>(() => resolveTeam(owned, saved));
  const [busy, setBusy] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const canSave = dirty && draft.length > 0 && !busy;

  const remove = (key: string) => setDraft((d) => d.filter((k) => k !== key));
  const add = (key: string) =>
    setDraft((d) => (d.length >= TEAM_SIZE || d.includes(key) ? d : [...d, key]));

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setDraft((d) => arrayMove(d, d.indexOf(String(active.id)), d.indexOf(String(over.id))));
  }

  async function persist() {
    setBusy(true);
    try {
      await saveFormation(userId, draft);
      await reload();
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  if (owned.length === 0) return <p className="muted">No units yet — try the Gacha.</p>;

  const rosterSorted = [...owned].sort((a, b) => {
    const ra = getCharacter(a.character_key).rarity;
    const rb = getCharacter(b.character_key).rarity;
    return rb - ra || b.level - a.level;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Team</h1>
          <p>
            Drag to reorder. First {ACTIVE_SLOTS} deploy; the last {TEAM_SIZE - ACTIVE_SLOTS} bench for
            mid-battle swaps. Order sets turn priority.
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={draft} strategy={horizontalListSortingStrategy}>
          <div className="card-grid" style={{ "--card-min": "116px", marginBottom: "var(--s-4)" } as React.CSSProperties}>
            {draft.map((key, i) => (
              <SlotCard key={key} characterKey={key} index={i} onRemove={() => remove(key)} />
            ))}
            {Array.from({ length: TEAM_SIZE - draft.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="card card--framed"
                style={{ opacity: 0.5 }}
              >
                <div className="card__meta" style={{ marginBottom: "var(--s-1)" }}>
                  {draft.length + i < ACTIVE_SLOTS ? `Active ${draft.length + i + 1}` : "Bench"}
                </div>
                <div className="muted" style={{ padding: "var(--s-6) 0" }}>Empty</div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="row" style={{ marginBottom: "var(--s-5)" }}>
        <button disabled={!canSave} onClick={persist}>
          {busy ? "Saving…" : "Save team"}
        </button>
        <button
          className="btn--ghost"
          disabled={!dirty || busy}
          onClick={() => setDraft(resolveTeam(owned, saved))}
        >
          Reset
        </button>
        {savedTick && <span className="chip chip--accent">Saved ✓</span>}
      </div>

      <h3>Roster</h3>
      <div className="card-grid" style={{ "--card-min": "112px" } as React.CSSProperties}>
        {rosterSorted.map((o) => {
          const c = getCharacter(o.character_key);
          const picked = draft.includes(o.character_key);
          const full = draft.length >= TEAM_SIZE;
          return (
            <button
              key={o.id}
              className="card card--framed"
              onClick={() => (picked ? remove(o.character_key) : add(o.character_key))}
              disabled={!picked && full}
              style={{
                "--rarity": picked ? "var(--accent-2)" : RARITIES[c.rarity].color,
                background: "var(--surface-1)",
                minHeight: 0,
                opacity: picked ? 0.6 : 1,
              } as React.CSSProperties}
            >
              <img className="card__img" src={assetUrl(c.art.portrait)} alt={c.name} />
              <div className="card__name">{c.name}</div>
              <div className="card__meta">
                Lv {o.level} · <span style={{ color: "var(--gold)" }}>{"★".repeat(o.star)}</span>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", color: ELEMENT_COLORS[c.element] }}>
                {picked ? "On team" : c.element}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
