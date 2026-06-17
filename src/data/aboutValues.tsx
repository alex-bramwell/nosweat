import type { ReactNode } from 'react';
import type { AboutValue } from '../types/tenant';

// Icon registry for the About "what makes us different" value cards. The owner
// picks an icon by key in the builder; the card renders the matching glyph.
const ICON_PATHS: Record<string, ReactNode> = {
  dumbbell: (
    <>
      <path d="M6.5 6.5l11 11" /><path d="M17.5 6.5l-11 11" />
      <circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  barbell: (
    <>
      <line x1="2" y1="12" x2="22" y2="12" />
      <rect x="2" y="8" width="3" height="8" rx="1" /><rect x="19" y="8" width="3" height="8" rx="1" />
      <rect x="7" y="10" width="2" height="4" /><rect x="15" y="10" width="2" height="4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </>
  ),
  community: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  lightning: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
};

export const ABOUT_ICON_OPTIONS = Object.keys(ICON_PATHS);

export const AboutValueIcon = ({ name, className }: { name: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {ICON_PATHS[name] ?? ICON_PATHS.target}
  </svg>
);

// Defaults mirror the original hardcoded cards, so a gym that never touches this
// gets the same content but can now edit/add/remove/reorder them.
export const DEFAULT_ABOUT_VALUES: AboutValue[] = [
  { icon: 'dumbbell', title: 'Functional Fitness', description: 'Constantly varied, high-intensity workouts that prepare you for anything life throws your way.' },
  { icon: 'activity', title: 'Scalable Workouts', description: 'Every session can be scaled to your fitness level, from day one to day one thousand.' },
  { icon: 'trophy', title: 'Track Progress', description: 'Monitor your improvements with benchmark workouts and personal record tracking.' },
  { icon: 'barbell', title: 'Premium Equipment', description: 'Top-tier equipment and a spacious facility designed for optimal training.' },
  { icon: 'calendar', title: 'Flexible Schedule', description: 'Multiple classes per week with morning, afternoon, and evening options to fit your lifestyle.' },
  { icon: 'target', title: 'Specialty Programs', description: 'From Olympic lifting to gymnastics, enhance your skills with targeted programming.' },
];
