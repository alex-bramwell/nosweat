# Content Architecture - CrossFit Comet

## Overview

This document describes the content architecture and data management strategy for the CrossFit Comet website.

## Architecture Decision: Hybrid Approach

We use a **hybrid data-driven and hard-coded approach**:

### Data-Driven Content (TypeScript + JSON-like data)
Content that changes frequently or has multiple items is stored as TypeScript data:

- ✅ **Programs** - Easy to add/remove/modify programs
- ✅ **Coaches** - Team members can be updated easily
- ✅ **Testimonials** - Growing list of member reviews
- ✅ **Stats** - Annual updates to member counts, years, etc.
- ✅ **WOD** - Daily workout content
- ✅ **Pricing** (future) - Membership tiers
- ✅ **Schedule** (future) - Class schedule

### Hard-Coded Content (Component-level)
Static content that rarely changes is hard-coded in components:

- ✅ **Hero section** - Main messaging and CTAs
- ✅ **CTA sections** - Call-to-action messaging
- ✅ **About/Mission** - Company story and philosophy
- ✅ **Section headings** - Titles and descriptions

## Benefits of This Approach

1. **Type Safety** - TypeScript ensures data consistency
2. **Easy Maintenance** - Update content in one place
3. **Scalable** - Add new items without touching components
4. **CMS-Ready** - Easy migration path to headless CMS
5. **Performance** - All data bundled at build time
6. **Developer Experience** - Clear separation of data and presentation

## Project Structure

```
src/
├── data/                    # Data files
│   ├── programs.ts         # Program offerings
│   ├── coaches.ts          # Coach profiles
│   ├── testimonials.ts     # Member testimonials
│   ├── stats.ts            # Gym statistics
│   └── wod.ts              # Workout of the day
├── types/                   # TypeScript types
│   └── index.ts            # All data type definitions
├── components/
│   ├── common/             # Reusable UI components
│   └── sections/           # Page section components
│       ├── Hero/           # Hero section (hard-coded)
│       ├── Stats/          # Stats display (data-driven)
│       ├── Programs/       # Programs grid (data-driven)
│       ├── WOD/            # WOD display (data-driven)
│       ├── Testimonials/   # Testimonials grid (data-driven)
│       └── CTA/            # Call-to-action (hard-coded)
└── pages/
    └── Home.tsx            # Homepage composition
```

## Data Types

### Program
```typescript
interface Program {
  id: string;                    // Unique identifier
  title: string;                 // Program name
  description: string;           // Short description
  features: string[];            // Bullet points
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  image?: string;                // Optional image path
}
```

### Coach
```typescript
interface Coach {
  id: string;                    // Unique identifier
  name: string;                  // Full name
  title: string;                 // Job title/role
  bio: string;                   // Biography
  certifications: string[];      // List of certs
  specialties: string[];         // Areas of expertise
  image?: string;                // Optional profile photo
}
```

### Testimonial
```typescript
interface Testimonial {
  id: string;                    // Unique identifier
  name: string;                  // Member name
  quote: string;                 // Testimonial text
  program?: string;              // Associated program
  image?: string;                // Optional photo
  memberSince?: string;          // Join year
}
```

### Stat
```typescript
interface Stat {
  id: string;                    // Unique identifier
  value: string | number;        // Numeric value
  label: string;                 // Display label
  suffix?: string;               // Optional suffix (e.g., "+")
}
```

### WOD
```typescript
interface WOD {
  id: string;                    // Unique identifier
  date: string;                  // ISO date string
  title: string;                 // WOD name
  description: string;           // Instructions
  movements: string[];           // Exercise list
  type: 'amrap' | 'fortime' | 'emom' | 'strength' | 'endurance';
  duration?: string;             // Time cap
  rounds?: number;               // Number of rounds
}
```

## How to Update Content

### Adding a New Program

1. Open `src/data/programs.ts`
2. Add a new object to the `programs` array:

```typescript
{
  id: 'new-program',
  title: 'New Program Name',
  description: 'Program description here',
  features: [
    'Feature 1',
    'Feature 2',
    'Feature 3',
  ],
  level: 'intermediate',
}
```

3. Save the file - component automatically updates!

### Adding a New Coach

1. Open `src/data/coaches.ts`
2. Add a new object to the `coaches` array:

```typescript
{
  id: 'john-doe',
  name: 'John Doe',
  title: 'Coach',
  bio: 'John's background and experience...',
  certifications: ['CF-L1', 'USA Weightlifting'],
  specialties: ['Strength Training', 'Mobility'],
}
```

### Adding a New Testimonial

1. Open `src/data/testimonials.ts`
2. Add a new object to the `testimonials` array:

```typescript
{
  id: 'testimonial-new',
  name: 'Jane Smith',
  quote: 'CrossFit Comet changed my life!',
  program: 'CrossFit',
  memberSince: '2025',
}
```

### Updating Daily WOD

1. Open `src/data/wod.ts`
2. Update the `todaysWOD` object:

```typescript
export const todaysWOD: WOD = {
  id: 'wod-2025-12-03',
  date: '2025-12-03',
  title: 'Tuesday Strength',
  description: 'Build to a heavy 3-rep max',
  movements: [
    'Front Squat',
    'Then: 3 rounds for time...',
  ],
  type: 'strength',
};
```

### Updating Stats

1. Open `src/data/stats.ts`
2. Update the values:

```typescript
{
  id: 'members',
  value: 300,  // Updated member count
  label: 'Active Members',
  suffix: '+',
}
```

## Component Architecture

### Section Components
Each section is self-contained with:
- Component logic (`.tsx`)
- Scoped styles (`.module.scss`)
- Index export (`index.ts`)

### Data Flow
```
Data File → Type Definition → Component → Render
```

Example:
```
programs.ts → Program[] → Programs.tsx → <ProgramCard />
```

## Future Enhancements

### Phase 1: Add More Data
- Pricing tiers (`src/data/pricing.ts`)
- Class schedule (`src/data/schedule.ts`)
- FAQ items (`src/data/faq.ts`)
- Blog posts (`src/data/blog.ts`)

### Phase 2: Content Management
Options for future CMS integration:
- **Contentful** - Headless CMS with GraphQL
- **Sanity** - Customizable content studio
- **Strapi** - Open-source headless CMS
- **WordPress** - Traditional CMS with REST API

Migration path:
1. Keep TypeScript types as-is
2. Replace static data files with API calls
3. Add loading states to components
4. Implement caching strategy

### Phase 3: Dynamic Features
- Real-time class capacity
- Member portal integration
- Online booking system
- WOD archive/search
- Coach booking calendar

## Best Practices

### Data Files
- ✅ Use meaningful IDs (kebab-case)
- ✅ Keep descriptions concise
- ✅ Use consistent date formats (ISO 8601)
- ✅ Add new items to the end of arrays
- ✅ Export const arrays for tree-shaking

### Types
- ✅ Use optional fields (`?`) for non-required data
- ✅ Use string literals for enums (`'beginner' | 'intermediate'`)
- ✅ Document complex types with comments
- ✅ Export all types from `types/index.ts`

### Components
- ✅ Map over data arrays for rendering
- ✅ Use unique `key` props (use ID field)
- ✅ Handle empty states gracefully
- ✅ Keep components focused on presentation
- ✅ Extract repeated patterns into subcomponents

## Examples

### Filtering Data
```typescript
// Show only beginner programs
const beginnerPrograms = programs.filter(p => p.level === 'beginner');

// Show latest 3 testimonials
const recentTestimonials = testimonials.slice(0, 3);
```

### Sorting Data
```typescript
// Sort coaches alphabetically
const sortedCoaches = [...coaches].sort((a, b) =>
  a.name.localeCompare(b.name)
);
```

### Conditional Rendering
```typescript
// Show WOD only if it exists
{todaysWOD && <WOD />}

// Show placeholder if no testimonials
{testimonials.length === 0 ? (
  <p>No testimonials yet</p>
) : (
  testimonials.map(t => <TestimonialCard key={t.id} {...t} />)
)}
```

## Performance Considerations

All data is:
- ✅ Bundled at build time (no runtime fetching)
- ✅ Tree-shaken (unused exports removed)
- ✅ Type-checked at compile time
- ✅ Minified in production
- ✅ Cached by browser

Current bundle size: ~207KB (65.5KB gzipped)

## Conclusion

This hybrid approach provides:
- **Flexibility** - Easy content updates
- **Performance** - Fast static site
- **Type Safety** - Compile-time checks
- **Scalability** - Ready for growth
- **Developer Experience** - Clear patterns

Update content in data files, and components automatically reflect changes!
