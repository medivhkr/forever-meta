// Знак сайта: петля бесконечности, Forever. Тот же контур рисует иконки приложения (scripts/make-icons.ts).
export const LOOP_PATH =
  'M12 12C10 9.3 7.9 7.5 6.4 7.5 4.4 7.5 3 9.6 3 12s1.4 4.5 3.4 4.5c1.5 0 3.6-1.8 5.6-4.5s4.1-4.5 5.6-4.5c2 0 3.4 2.1 3.4 4.5s-1.4 4.5-3.4 4.5c-1.5 0-3.6-1.8-5.6-4.5Z';

export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={LOOP_PATH} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
