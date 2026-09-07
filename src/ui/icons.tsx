/** Minimal 24×24 stroke icons (currentColor). No icon-font dependency.
 *  Used by the Home hub's mode cards (sized via .mode-card svg). */

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconStages = () => (
  <Svg>
    <path d="M5 3v18" />
    <path d="M5 4h12l-2.5 3.5L17 11H5" />
  </Svg>
);

export const IconGacha = () => (
  <Svg>
    <path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7z" />
    <path d="M18.5 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z" />
  </Svg>
);

export const IconEndless = () => (
  <Svg>
    <circle cx="8" cy="12" r="4" />
    <circle cx="16" cy="12" r="4" />
  </Svg>
);
