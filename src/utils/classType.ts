/**
 * Class-type detection shared by the schedule grid and the day-pass class
 * picker. The gym's primary group class is "CrossFit" by default, or
 * "Group Training" on the genericised demo gym - both count as primary. Open
 * gym and specialty are the other two types.
 */
export type ClassTypeKey = 'crossfit' | 'open-gym' | 'specialty' | 'both';

const hasPrimary = (n: string) => n.includes('crossfit') || n.includes('group training');
const hasOpenGym = (n: string) => n.includes('open gym');
const hasSpecialty = (n: string) => n.includes('specialty');

/** True if the class is the gym's primary group class (CrossFit / Group Training). */
export const isPrimaryClass = (className: string): boolean => hasPrimary(className.toLowerCase());

/** Splits a combined class name ("X | Y") into its parts. */
export const getClassTypes = (className: string): string[] =>
  className.includes('|') ? className.split('|').map((p) => p.trim()) : [className];

/** Classifies a class name into a style key. Primary group class is the default. */
export const classifyClass = (className: string): ClassTypeKey => {
  const n = className.toLowerCase();
  if (hasSpecialty(n)) return 'specialty';
  if (hasPrimary(n) && hasOpenGym(n)) return 'both';
  if (hasOpenGym(n)) return 'open-gym';
  return 'crossfit';
};
