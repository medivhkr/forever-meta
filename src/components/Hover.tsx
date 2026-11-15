import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import ItemTooltip from './ItemTooltip.tsx';
import CharacterCard from './CharacterCard.tsx';

// Всплывающие подсказки для предметов и персонажей.
// Одна подсказка на всё приложение: провайдер хранит, что показывать и где, и рисует её через портал в body.

export type HoverTarget = { kind: 'item'; id: number } | { kind: 'character'; id: string };

interface HoverApi {
  show: (target: HoverTarget, el: HTMLElement) => void;
  hide: () => void;
}

const HoverContext = createContext<HoverApi | null>(null);

export function HoverProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ target: HoverTarget; rect: DOMRect } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { pathname } = useLocation();

  const show = useCallback((target: HoverTarget, el: HTMLElement) => {
    window.clearTimeout(timer.current);
    // Небольшая задержка, чтобы подсказки не мелькали при быстром движении мыши
    timer.current = window.setTimeout(() => setState({ target, rect: el.getBoundingClientRect() }), 70);
  }, []);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setState(null);
  }, []);

  // Прячем подсказку при прокрутке (в том числе внутри таблиц) и при переходе на другую страницу
  useEffect(() => {
    if (!state) return;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', hide, { capture: true });
  }, [state, hide]);

  useEffect(() => {
    hide();
  }, [pathname, hide]);

  const api = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <HoverContext value={api}>
      {children}
      {state &&
        createPortal(
          <Floating rect={state.rect}>
            {state.target.kind === 'item' ? <ItemTooltip id={state.target.id} /> : <CharacterCard id={state.target.id} />}
          </Floating>,
          document.body,
        )}
    </HoverContext>
  );
}

interface TriggerHandlers {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: () => void;
}

// Обработчики для элемента, при наведении на который нужна подсказка
export function useHoverTrigger(target: HoverTarget | null): TriggerHandlers {
  const api = useContext(HoverContext);
  if (!api || !target) return {};
  return {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => api.show(target, e.currentTarget),
    onMouseLeave: () => api.hide(),
    onFocus: (e: FocusEvent<HTMLElement>) => api.show(target, e.currentTarget),
    onBlur: () => api.hide(),
  };
}

const GAP = 12;
const PAD = 8;

function Floating({ rect, children }: { rect: DOMRect; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // useLayoutEffect: меряем подсказку до того, как браузер нарисует кадр, чтобы она не мигнула не на своём месте
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      const { width, height } = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left: number;
      let top: number;
      if (rect.right + GAP + width <= vw - PAD) {
        left = rect.right + GAP;
        top = rect.top;
      } else if (rect.left - GAP - width >= PAD) {
        left = rect.left - GAP - width;
        top = rect.top;
      } else {
        left = Math.min(Math.max(PAD, rect.left), vw - width - PAD);
        top = rect.bottom + GAP;
        if (top + height > vh - PAD) top = rect.top - GAP - height;
      }
      top = Math.min(Math.max(PAD, top), Math.max(PAD, vh - height - PAD));
      setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
    };
    place();
    // Содержимое может догрузиться и поменять размер: тогда пересчитываем положение
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rect]);

  return (
    <div
      ref={ref}
      className="floating"
      role="tooltip"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      {children}
    </div>
  );
}
