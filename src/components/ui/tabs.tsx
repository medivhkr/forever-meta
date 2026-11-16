import * as React from "react";
import { motion } from "motion/react";
import { cn } from "cn";
import { SPRING_LAYOUT } from "devignerui/motion";
import { useControllableState } from "devignerui/hooks";
import { useReducedMotionPreference } from "devignerui/hooks";

export interface TabsOption<T extends string = string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsClassNames {
  option?: string;
  indicator?: string;
}

export type TabsSize = "sm" | "md" | "lg";

type TabsOptions = readonly (string | TabsOption)[];

export type TabsValue<O extends TabsOptions> = O[number] extends infer E
  ? E extends string
    ? E
    : E extends { value: infer V extends string }
      ? V
      : never
  : never;
export interface TabsProps<O extends TabsOptions = TabsOptions> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  options: O;
  value?: TabsValue<O>;
  defaultValue?: TabsValue<O>;
  onValueChange?: (value: TabsValue<O>) => void;
  label?: string;
  size?: TabsSize;
  fill?: boolean;
  name?: string;
  disabled?: boolean;
  classNames?: TabsClassNames;
}

const SIZES = {
  sm: "h-6 gap-1 px-2.5 text-[11px] [&_svg]:size-3.5",
  md: "h-7 gap-1.5 px-3 text-[12px] [&_svg]:size-4",
  lg: "h-9 gap-2 px-4 text-[14px] [&_svg]:size-4 [&_img]:size-4",
} as const;
const ICON_PAD = { sm: "pl-2", md: "pl-2.5", lg: "pl-3" } as const;

const toOption = (o: string | TabsOption): TabsOption =>
  typeof o === "string" ? { value: o } : o;

function TabsInner(
  {
    options,
    value: valueProp,
    defaultValue,
    onValueChange,
    label,
    size = "md",
    fill = false,
    name,
    disabled = false,
    classNames,
    className,
    ...props
  }: TabsProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const items = options.map(toOption);
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue: defaultValue ?? items.find((o) => !o.disabled)?.value,
    onValueChange: onValueChange as (v: string | undefined) => void,
  });
  const reduced = useReducedMotionPreference();
  const autoName = React.useId();
  const list = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => list.current!);
  const [pill, setPill] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    glide: boolean;
  } | null>(null);
  const placed = React.useRef(false);
  React.useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = (glide: boolean) => {
      const on = el.querySelector<HTMLElement>("[data-checked]");
      setPill(
        on
          ? {
              x: on.offsetLeft,
              y: on.offsetTop,
              width: on.offsetWidth,
              height: on.offsetHeight,
              glide,
            }
          : null,
      );
    };
    place(placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      ref={list}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative max-w-full rounded-[10px] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-1",
        fill ? "flex w-full" : "inline-flex",
        className,
      )}
      {...props}
    >
      {pill && (
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            x: pill.x,
            y: pill.y,
            width: pill.width,
            height: pill.height,
          }}
          transition={pill.glide && !reduced ? SPRING_LAYOUT : { duration: 0 }}
          className={cn(
            "absolute top-0 left-0 rounded-[7px] bg-[var(--color-accent)]",
            classNames?.indicator,
          )}
        />
      )}
      {items.map((o) => {
        const checked = o.value === value;
        const off = disabled || o.disabled;
        const iconOnly = o.label === null;
        return (
          <label
            key={o.value}
            data-checked={checked || undefined}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center justify-center rounded-[7px] font-medium whitespace-nowrap select-none",
              "transition-colors duration-150 ease-out",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-[var(--color-focus)]",
              SIZES[size],
              o.icon && ICON_PAD[size],
              iconOnly && "aspect-square px-0",
              fill && "flex-1",
              checked
                ? "text-[var(--color-accent-ink)]"
                : "text-[var(--color-ink-2)] hover:text-[var(--color-ink)]",
              off && "pointer-events-none opacity-50",
              classNames?.option,
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={name ?? autoName}
              value={o.value}
              checked={checked}
              disabled={off}
              aria-label={iconOnly ? o.value : undefined}
              onChange={() => setValue(o.value)}
            />
            {o.icon && (
              <span aria-hidden className="relative flex">
                {(checked && o.activeIcon) || o.icon}
              </span>
            )}
            {!iconOnly && (
              <span className="relative">{o.label ?? o.value}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export const Tabs = React.forwardRef(TabsInner) as (<
  const O extends TabsOptions,
>(
  props: TabsProps<O> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement) & { displayName?: string };
Tabs.displayName = "Tabs";
