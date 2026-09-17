import React from 'react';

const P = { stroke: 'currentColor', strokeWidth: 1.3, fill: 'none' };

export const NAV_ICONS = {
  grid: (
    <>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" {...P} />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" {...P} />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" {...P} />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" {...P} />
    </>
  ),
  tasks: (
    <>
      <rect x="2.5" y="2" width="11" height="12" rx="1.5" {...P} />
      <path d="M5.2 6.2 6.3 7.3 8.5 5" {...P} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 10.2h5.6" {...P} strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),
  shield: <path d="M8 1.5 14 4.5V8.5C14 12 11.5 14 8 14.5C4.5 14 2 12 2 8.5V4.5L8 1.5Z" {...P} />,
  target: (
    <>
      <circle cx="8" cy="8" r="6" {...P} />
      <path d="M8 2v12M2 8h12" {...P} strokeWidth={1.1} />
    </>
  ),
  docLines: (
    <>
      <rect x="2" y="2" width="12" height="12" rx="1.5" {...P} />
      <path d="M5 6h6M5 8.5h6M5 11h3.5" {...P} strokeWidth={1.1} />
    </>
  ),
  bookmark: <path d="M4 2h8v12l-4-2-4 2V2Z" {...P} />,
  table: (
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="1.3" {...P} />
      <path d="M1.5 6.2h13" {...P} strokeWidth={1.1} />
    </>
  ),
  check: <path d="M2 8.5 6 12.5 14 3.5" {...P} strokeWidth={1.4} strokeLinecap="round" />,
  briefcase: (
    <>
      <rect x="2" y="4" width="12" height="9" rx="1.3" {...P} />
      <path d="M5 4V2.5h6V4" {...P} />
    </>
  ),
  people: (
    <>
      <circle cx="8" cy="5.5" r="2.5" {...P} />
      <path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" {...P} />
    </>
  ),
  building: <path d="M2 13.5V6l6-4 6 4v7.5H2Z" {...P} />,
  clock: (
    <>
      <circle cx="8" cy="8" r="6" {...P} />
      <path d="M8 5v3l2 1.5" {...P} strokeLinecap="round" />
    </>
  ),
  review: (
    <>
      <path d="M3 3h10v10H3z" {...P} />
      <path d="M5.5 8h5" {...P} />
    </>
  ),
  file: <path d="M4 1.5h6l2.5 2.5V14.5H4V1.5Z" {...P} />,
  archive: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1.3" {...P} />
      <path d="M2 6.5h12" {...P} strokeWidth={1.1} />
    </>
  ),
  form: <rect x="2.5" y="2" width="11" height="12" rx="1.3" {...P} />,
  list: (
    <>
      <path d="M3 2.5h10v11H3z" {...P} />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" {...P} strokeWidth={1.1} />
    </>
  ),
  circle: <circle cx="8" cy="8" r="6" {...P} />,
  flag: (
    <>
      <path d="M8 2v7M8 12.2v.3" {...P} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="8" cy="8" r="6" {...P} />
    </>
  ),
  triangle: <path d="M8 1.5 14.5 13H1.5L8 1.5Z" {...P} />,
  scale: (
    <>
      <circle cx="6" cy="8" r="2.5" {...P} />
      <circle cx="11" cy="8" r="2.5" {...P} />
    </>
  ),
  sparkle: (
    <path
      d="M8 1.5c-2.2 0-4 1.7-4 4 0 1.5.8 2.5 1.5 3.3.4.5.7 1 .7 1.7v.5h3.6v-.5c0-.7.3-1.2.7-1.7.7-.8 1.5-1.8 1.5-3.3 0-2.3-1.8-4-4-4Z"
      {...P}
    />
  ),
  dashed: <circle cx="8" cy="8" r="6" {...P} strokeDasharray="2 2" />,
  sim: <path d="M2 12 6 6l3 3 5-6" {...P} strokeLinecap="round" strokeLinejoin="round" />,
  network: (
    <>
      <circle cx="5" cy="8" r="2.3" {...P} />
      <circle cx="11" cy="4" r="2" {...P} />
      <circle cx="11" cy="12" r="2" {...P} />
      <path d="M7 7l2-2M7 9l2 2" {...P} strokeWidth={1.2} />
    </>
  ),
  bars: <path d="M2.5 13.5V9M6.2 13.5V5.5M9.8 13.5V8M13.5 13.5V3" {...P} strokeWidth={1.4} strokeLinecap="round" />,
  key: (
    <>
      <circle cx="5.5" cy="8" r="2.5" {...P} />
      <path d="M7.8 8h6.2M11 8v2M13 8v1.6" {...P} />
    </>
  ),
  flow: (
    <>
      <circle cx="4" cy="4" r="2" {...P} />
      <circle cx="12" cy="4" r="2" {...P} />
      <circle cx="8" cy="12" r="2" {...P} />
      <path d="M5.4 5.4 6.6 10.6M10.6 5.4 9.4 10.6" {...P} strokeWidth={1.1} />
    </>
  ),
  bell: (
    <>
      <path d="M4 6.5c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3 1.2 4 1.2 4H2.8s1.2-1 1.2-4Z" {...P} />
      <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" {...P} />
    </>
  ),
  gear: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.2" {...P} />
      <path d="M5.5 8h5" {...P} />
    </>
  ),
  link: (
    <path
      d="M6.5 9.5 9.5 6.5M6 4.5 7.5 3a2.5 2.5 0 0 1 3.5 3.5L9.5 8M10 11.5 8.5 13A2.5 2.5 0 0 1 5 9.5L6.5 8"
      {...P}
      strokeLinecap="round"
    />
  ),
};

export function NavIcon({ name, className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      {NAV_ICONS[name] || NAV_ICONS.circle}
    </svg>
  );
}
