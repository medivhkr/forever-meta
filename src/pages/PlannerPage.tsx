import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useCharacters, useItems } from '../data/api.ts';
import {
  CLASS_ARMOR,
  GEAR_ALL,
  GEAR_LABEL,
  GEAR_LEFT,
  GEAR_RIGHT,
  GEAR_WEAPONS,
  ROLE_STATS,
  STAT_LABEL,
  characterFocus,
  sumStats,
} from '../data/items.ts';
import { SPEC_KEYS, specInfo } from '../data/specs.ts';
import type { GearSlot, Item } from '../data/types.ts';
import { formatIlvl, formatNumber } from '../lib/format.ts';
import { usePageTitle } from '../lib/helpers.ts';
import { decodePlan, emptyGear, encodePlan, planReducer, statDelta, type PlanState } from '../planner/plan.ts';
import { PAGE_ICON } from '../data/art.ts';
import GameIcon from '../components/GameIcon.tsx';
import ItemIcon from '../components/ItemIcon.tsx';
import ItemPicker from '../components/ItemPicker.tsx';
import PageHero from '../components/PageHero.tsx';
import { useHoverTrigger } from '../components/Hover.tsx';
import { ErrorState, Loading } from '../components/States.tsx';

const STORAGE_KEY = 'forever-meta:planner';
const CLASS_ORDER = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'];

// Начальное состояние: из ссылки, иначе из прошлого визита, иначе пустая сборка
function initialState(params: URLSearchParams): { state: PlanState; fromSaved: boolean } {
  const fromUrl = decodePlan(params, () => true);
  if (fromUrl) return { state: fromUrl, fromSaved: true };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const fromStorage = saved ? decodePlan(new URLSearchParams(saved), () => true) : null;
    if (fromStorage) return { state: fromStorage, fromSaved: true };
  } catch {
    // хранилище недоступно
  }
  return { state: { cls: 'mage', spec: 'fire', gear: emptyGear(), baseId: null }, fromSaved: false };
}

export default function PlannerPage() {
  usePageTitle('Конструктор экипировки');
  const items = useItems();
  const characters = useCharacters();
  const [params, setParams] = useSearchParams();
  const [init] = useState(() => initialState(params));
  const [state, dispatch] = useReducer(planReducer, init.state);
  const [picking, setPicking] = useState<GearSlot | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  // Первый визит без ссылки: начинаем с экипировки лучшего по уровню предметов персонажа
  const started = useRef(false);
  useEffect(() => {
    if (started.current || init.fromSaved || !characters.data) return;
    started.current = true;
    const best = [...characters.data.list].sort((a, b) => b.ilvl - a.ilvl)[0];
    if (best) dispatch({ type: 'load', state: { cls: best.cls, spec: best.spec, gear: best.gear, baseId: best.id } });
  }, [init.fromSaved, characters.data]);

  // Сборка живёт в адресе страницы и в localStorage. Адрес меняем, только если он отличается,
  // иначе обновление адреса снова запускало бы этот эффект.
  useEffect(() => {
    const encoded = encodePlan(state);
    if (window.location.search.replace(/^\?/, '') !== encoded) setParams(new URLSearchParams(encoded), { replace: true });
    try {
      localStorage.setItem(STORAGE_KEY, encoded);
    } catch {
      // без сохранения
    }
    // setParams намеренно не в зависимостях: React Router пересоздаёт её при каждой смене адреса
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const byId = items.data?.byId;
  const equippedItems = useMemo(
    () => GEAR_ALL.map((slot) => (state.gear[slot] !== null && byId ? byId.get(state.gear[slot]!) : undefined)),
    [state.gear, byId],
  );
  const totals = useMemo(() => sumStats(equippedItems), [equippedItems]);
  const base = state.baseId ? characters.data?.byId.get(state.baseId) : undefined;
  const baseTotals = useMemo(
    () => (base && byId ? sumStats(GEAR_ALL.map((slot) => (base.gear[slot] !== null ? byId.get(base.gear[slot]!) : undefined))) : null),
    [base, byId],
  );

  if (items.isPending || characters.isPending) return <Loading />;
  if (items.isError) return <ErrorState error={items.error} onRetry={() => void items.refetch()} />;
  if (characters.isError) return <ErrorState error={characters.error} onRetry={() => void characters.refetch()} />;

  const info = specInfo(state.cls, state.spec);
  const focus = characterFocus(state);
  const delta = baseTotals ? statDelta(totals, baseTotals) : null;
  const worn = equippedItems.filter((item): item is Item => item !== undefined);
  const ilvl = worn.length ? worn.reduce((sum, item) => sum + item.ilvl, 0) / worn.length : 0;
  const baseIlvl = base?.ilvl ?? null;
  const twoHanded = equippedItems[GEAR_ALL.indexOf('mainhand')]?.slot === 'twohand';
  const itemIn = (slot: GearSlot) => equippedItems[GEAR_ALL.indexOf(slot)];
  const allItems = items.data.db.items;
  const itemsById = items.data.byId;

  function copyLink() {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  }

  const slotView = (slot: GearSlot) => (
    <PlannerSlot key={slot} slot={slot} item={itemIn(slot)} disabled={slot === 'offhand' && twoHanded} onOpen={() => setPicking(slot)} />
  );

  return (
    <>
      <PageHero
        icon={<GameIcon icon={PAGE_ICON.planner} size={64} letter="К" eager />}
        art={PAGE_ICON.planner}
        title="Конструктор экипировки"
        chips={[`${allItems.length} предметов`, 'TBC Anniversary', 'Ссылка на сборку']}
      >
        <p>
          Собери комплект из рейдовых предметов TBC и смотри, как меняются характеристики. Сборка хранится в адресе страницы: отправь
          ссылку, и у друга откроется то же самое.
        </p>
      </PageHero>

      <div className="planner-bar panel">
        <label className="field">
          <span className="field__label">Спек</span>
          <select
            id="planner-spec"
            className="input input--select"
            value={`${state.cls}/${state.spec}`}
            onChange={(e) => {
              const [cls, spec] = e.target.value.split('/');
              dispatch({ type: 'spec', cls, spec });
            }}
          >
            {CLASS_ORDER.map((cls) => (
              <optgroup key={cls} label={specInfo(cls, '').clsName}>
                {SPEC_KEYS.filter((key) => key.startsWith(`${cls}/`)).map((key) => {
                  const [c, s] = key.split('/');
                  return (
                    <option key={key} value={key}>
                      {specInfo(c, s).name}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Сравнить с</span>
          <select
            id="planner-compare"
            className="input input--select"
            value={state.baseId ?? ''}
            onChange={(e) => dispatch({ type: 'compare', baseId: e.target.value || null })}
          >
            <option value="">Ни с кем</option>
            {characters.data.list.map((c) => {
              const ci = specInfo(c.cls, c.spec);
              return (
                <option key={c.id} value={c.id}>
                  {c.name}: {ci.name}, {ci.clsName.toLowerCase()}, {formatIlvl(c.ilvl)}
                </option>
              );
            })}
          </select>
        </label>
        <div className="planner-bar__actions">
          {base && (
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'load', state: { cls: base.cls, spec: base.spec, gear: base.gear, baseId: base.id } })}
            >
              Надеть всё как у {base.name}
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={copyLink} aria-live="polite">
            {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
          </button>
          <button type="button" className="btn btn--plain btn--danger" onClick={() => dispatch({ type: 'clear' })}>
            Снять всё
          </button>
        </div>
      </div>

      <section className="panel" aria-label="Экипировка">
      <div className="panel__body">
      <div className="doll">
        <div className="doll__col">{GEAR_LEFT.map(slotView)}</div>
        <div className="doll__center">
          <div className="doll-stats">
            <div className="planner-ilvl">
              <strong>{formatIlvl(ilvl)}</strong>
              <span>
                средний уровень предметов
                {baseIlvl !== null && <Delta value={ilvl - baseIlvl} digits={1} />}
              </span>
            </div>
            <h3>
              {info.name}, {info.clsName.toLowerCase()}
            </h3>
            <dl>
              {ROLE_STATS[focus].map((key) => (
                <div key={key}>
                  <dt>{STAT_LABEL[key] ?? 'Броня'}</dt>
                  <dd>
                    {delta && <Delta value={delta[key] ?? 0} />}
                    {formatNumber(totals[key] ?? 0)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="doll-stats__hint">
              {base ? `Зелёным и красным отмечена разница с экипировкой ${base.name}.` : 'Выбери персонажа в поле «Сравнить с», чтобы видеть разницу.'}
            </p>
          </div>
        </div>
        <div className="doll__col doll__col--right">{GEAR_RIGHT.map(slotView)}</div>
        <div className="doll__weapons">{GEAR_WEAPONS.map(slotView)}</div>
      </div>
      </div>
      </section>

      {picking && (
        <ItemPicker
          slot={picking}
          items={allItems}
          byId={itemsById}
          current={state.gear[picking]}
          equipped={new Set(worn.map((item) => item.id))}
          armorType={CLASS_ARMOR[state.cls] ?? 'Cloth'}
          focus={focus}
          onPick={(item) => {
            dispatch({ type: 'equip', slot: picking, item });
            setPicking(null);
          }}
          onUnequip={() => {
            dispatch({ type: 'unequip', slot: picking });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}

// Разница с тем, с кем сравниваем: зелёным — больше, красным — меньше
function Delta({ value, digits = 0 }: { value: number; digits?: number }) {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return null;
  return (
    <span className={rounded > 0 ? 'delta is-up' : 'delta is-down'}>
      {rounded > 0 ? '+' : '−'}
      {Math.abs(rounded).toLocaleString('ru-RU', { maximumFractionDigits: digits })}
    </span>
  );
}

interface SlotProps {
  slot: GearSlot;
  item: Item | undefined;
  disabled: boolean;
  onOpen: () => void;
}

function PlannerSlot({ slot, item, disabled, onOpen }: SlotProps) {
  const hover = useHoverTrigger(item ? { kind: 'item', id: item.id } : null);
  const classes = item ? 'gear gear--btn' : 'gear gear--btn is-empty';
  return (
    <button
      type="button"
      className={classes}
      data-q={item?.q}
      disabled={disabled}
      aria-label={`${GEAR_LABEL[slot]}: ${item ? item.name : 'пусто'}. Выбрать предмет`}
      {...hover}
      onClick={() => {
        // Прячем подсказку предмета: поверх неё сейчас откроется окно выбора
        hover.onMouseLeave?.();
        onOpen();
      }}
    >
      {item ? (
        <ItemIcon item={item} size={40} />
      ) : (
        <span className="gear__blank gear__blank--add" aria-hidden="true">
          +
        </span>
      )}
      <span className="gear__text">
        <span className="gear__name">{item ? item.name : disabled ? 'Занята двуручным оружием' : 'Выбрать предмет'}</span>
        <span className="gear__meta">{GEAR_LABEL[slot]}</span>
      </span>
      {item && <span className="gear__ilvl">{item.ilvl}</span>}
    </button>
  );
}
