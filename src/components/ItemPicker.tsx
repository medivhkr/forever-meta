import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ARMOR_SLOTS, ARMOR_TYPES, GEAR_LABEL, STAT_SHORT, itemFocus, keyStats, type Focus } from '../data/items.ts';
import type { GearSlot, Item } from '../data/types.ts';
import { fitsSlot } from '../planner/plan.ts';
import ItemIcon from './ItemIcon.tsx';
import ItemTooltip from './ItemTooltip.tsx';

interface Props {
  slot: GearSlot;
  items: Item[];
  byId: Map<number, Item>;
  current: number | null;
  equipped: Set<number>;
  armorType: string;
  focus: Focus;
  onPick: (item: Item) => void;
  onUnequip: () => void;
  onClose: () => void;
}

const LIMIT = 120;

// Окно выбора предмета на нативном <dialog>: браузер сам держит фокус внутри,
// закрывает по Esc и делает страницу под окном недоступной для клавиатуры.
export default function ItemPicker({ slot, items, byId, current, equipped, armorType, focus, onPick, onUnequip, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [onlySpec, setOnlySpec] = useState(true);
  const [onlyArmor, setOnlyArmor] = useState(true);
  const [preview, setPreview] = useState<Item | null>(null);
  const deferredQuery = useDeferredValue(query);
  const armorSlot = ARMOR_SLOTS.has(slot);
  const armorLabel = ARMOR_TYPES.find((a) => a.value === armorType)?.label.toLowerCase() ?? armorType;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const list = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().replace(/ё/g, 'е');
    return items
      .filter((item) => fitsSlot(item, slot))
      .filter((item) => !onlySpec || [focus, 'other'].includes(itemFocus(item)))
      .filter((item) => !onlyArmor || !armorSlot || item.type === armorType)
      .filter((item) => !q || item.name.toLowerCase().replace(/ё/g, 'е').includes(q) || item.nameEn.toLowerCase().includes(q))
      .sort((a, b) => b.ilvl - a.ilvl || a.name.localeCompare(b.name, 'ru'));
  }, [items, slot, onlySpec, focus, onlyArmor, armorSlot, armorType, deferredQuery]);

  const shown = list.slice(0, LIMIT);
  const previewItem = preview ?? (current !== null ? byId.get(current) : undefined) ?? shown[0];

  return (
    <dialog
      ref={ref}
      className="picker"
      aria-labelledby="picker-title"
      onClose={onClose}
      onClick={(e) => {
        // Клик по затемнённому фону — закрыть
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="picker__inner">
        <header className="picker__head">
          <div>
            <p className="eyebrow">{GEAR_LABEL[slot]}</p>
            <h2 id="picker-title">Выбери предмет</h2>
          </div>
          <button type="button" className="picker__close" onClick={() => ref.current?.close()} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className="picker__filters">
          <input
            id="picker-search"
            className="input"
            type="search"
            placeholder="Название, можно по-английски"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск предмета"
            autoFocus
          />
          <label className="check">
            <input id="picker-only-spec" type="checkbox" checked={onlySpec} onChange={(e) => setOnlySpec(e.target.checked)} />
            Под этот спек
          </label>
          {armorSlot && (
            <label className="check">
              <input id="picker-only-armor" type="checkbox" checked={onlyArmor} onChange={(e) => setOnlyArmor(e.target.checked)} />
              Только {armorLabel}
            </label>
          )}
          {current !== null && (
            <button type="button" className="btn btn--ghost" onClick={onUnequip}>
              Снять предмет
            </button>
          )}
        </div>

        <div className="picker__body">
          <ul className="picker__list" aria-label="Предметы">
            {shown.map((item) => {
              const taken = item.unique && equipped.has(item.id) && item.id !== current;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === current ? 'picker__item is-current' : 'picker__item'}
                    data-q={item.q}
                    disabled={taken}
                    onMouseEnter={() => setPreview(item)}
                    onFocus={() => setPreview(item)}
                    onClick={() => onPick(item)}
                  >
                    <ItemIcon item={item} size={32} eager />
                    <span className="picker__text">
                      <span className="picker__name">{item.name}</span>
                      <span className="picker__meta">
                        {item.ilvl} · {item.typeRu ?? item.slotRu}
                        {taken ? ' · уже надет' : item.id === current ? ' · надет сейчас' : ''}
                      </span>
                    </span>
                    <span className="badges">
                      {keyStats(item, 2).map((s) => (
                        <span key={s.key} className="badge">
                          +{s.value} {STAT_SHORT[s.key] ?? s.key}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="picker__empty">Ничего не нашлось. Сними галочки фильтров.</li>}
            {list.length > LIMIT && <li className="picker__empty">Показаны первые {LIMIT} из {list.length}. Уточни поиск.</li>}
          </ul>
          <aside className="picker__preview" aria-label="Подсказка выбранного предмета">
            {previewItem && <ItemTooltip item={previewItem} />}
          </aside>
        </div>
      </div>
    </dialog>
  );
}
