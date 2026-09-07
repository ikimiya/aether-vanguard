/** Minimal 24×24 stroke icons (currentColor). No icon-font dependency.
 *  Sized by CSS (.bottom-nav__item svg). */

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

export const IconRoster = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
  </Svg>
);

export const IconTeam = () => (
  <Svg>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.9" />
    <path d="M18 20a5.5 5.5 0 0 0-3.2-5" />
  </Svg>
);

export const IconEndless = () => (
  <Svg>
    <circle cx="8" cy="12" r="4" />
    <circle cx="16" cy="12" r="4" />
  </Svg>
);
