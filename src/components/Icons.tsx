// Мелкие значки интерфейса. Линии в 1,6–2 px со скруглёнными концами, как в SF Symbols.

interface Props {
  className?: string;
}

export function SearchIcon({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="m13 13 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeft({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 12 20" aria-hidden="true" focusable="false">
      <path d="M9.5 2.5 2 10l7.5 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
