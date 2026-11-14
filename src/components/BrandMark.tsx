// Знак сайта: ромб с петлёй бесконечности.
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16 2 30 16 16 30 2 16Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 7 25 16 16 25 7 16Z" fill="currentColor" opacity="0.14" />
      <path
        d="M10.4 16c0-1.9 1.4-3.2 3-3.2 2.7 0 3.6 6.4 6.2 6.4 1.7 0 2.9-1.3 2.9-3.2s-1.2-3.2-2.9-3.2c-2.6 0-3.5 6.4-6.2 6.4-1.6 0-3-1.3-3-3.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
