# CrossFit Comet - UI Component Library

## Overview

This document describes the foundational UI components built for the CrossFit Comet website. All components follow React best practices with TypeScript, CSS Modules, and proper accessibility.

## Component Architecture

```
src/components/common/
├── Button/           # Button component with variants
├── Card/             # Content card containers
├── Section/          # Section wrapper for page layout
├── Container/        # Max-width container for content
└── index.ts          # Centralized exports
```

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' (default: 'primary')
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `fullWidth`: boolean (default: false)
- `as`: 'button' | 'a' - Render as button or anchor tag
- `href`: string - URL when rendered as anchor
- Extends all standard HTML button attributes

**Usage:**
```tsx
import { Button } from '@/components/common';

// Primary button
<Button variant="primary">Join Now</Button>

// Outline button as link
<Button variant="outline" as="a" href="/schedule">View Schedule</Button>

// Large primary button
<Button variant="primary" size="large" fullWidth>
  Book Free Trial
</Button>
```

**Variants:**
- **Primary**: Bold orange background (--color-accent)
- **Secondary**: Surface color background
- **Outline**: Transparent with colored border
- **Ghost**: Transparent, minimal styling

**Features:**
- Hover effects with lift animation
- Focus visible states for accessibility
- Disabled state styling
- Smooth transitions

---

### Card

A content container component with different visual styles.

**Props:**
- `variant`: 'default' | 'elevated' | 'bordered' (default: 'default')
- `padding`: 'none' | 'small' | 'medium' | 'large' (default: 'medium')
- `hoverable`: boolean (default: false) - Adds hover lift effect
- Extends all standard HTML div attributes

**Usage:**
```tsx
import { Card } from '@/components/common';

// Basic card
<Card>
  <h3>Workout of the Day</h3>
  <p>5 rounds for time...</p>
</Card>

// Elevated card with hover effect
<Card variant="elevated" hoverable>
  <h3>CrossFit Fundamentals</h3>
  <p>Learn the basics...</p>
</Card>

// Card with no padding
<Card padding="none">
  <img src="hero.jpg" alt="Gym" />
  <div style={{ padding: '1rem' }}>
    <h3>Title</h3>
  </div>
</Card>
```

**Variants:**
- **Default**: Standard surface background
- **Elevated**: Adds box shadow for depth
- **Bordered**: Border instead of shadow

**Features:**
- Smooth hover transitions when hoverable
- Flexible padding options
- Composable with other components

---

### Section

A semantic section wrapper for page layout with consistent spacing.

**Props:**
- `spacing`: 'none' | 'small' | 'medium' | 'large' | 'xlarge' (default: 'medium')
- `background`: 'default' | 'surface' | 'dark' (default: 'default')
- `fullWidth`: boolean (default: false) - Removes horizontal padding
- `as`: 'section' | 'div' | 'article' (default: 'section')
- Extends all standard HTML section attributes

**Usage:**
```tsx
import { Section, Container } from '@/components/common';

// Standard section with medium spacing
<Section>
  <Container>
    <h2>About Us</h2>
    <p>Welcome to CrossFit Comet...</p>
  </Container>
</Section>

// Large spacing with dark background
<Section spacing="large" background="dark">
  <Container>
    <h2>Our Programs</h2>
  </Container>
</Section>
```

**Spacing:**
- **none**: 0 padding
- **small**: 2rem vertical (1.5rem mobile)
- **medium**: 4rem vertical (3rem mobile)
- **large**: 6rem vertical (4rem mobile)
- **xlarge**: 8rem vertical (5rem mobile)

**Backgrounds:**
- **default**: --color-bg (#181820)
- **surface**: --color-surface (#23232e)
- **dark**: --color-bg-dark (#0f0f14)

**Features:**
- Responsive spacing adjustments
- Semantic HTML elements
- Visual hierarchy through backgrounds

---

### Container

A max-width container for centering content with responsive padding.

**Props:**
- `size`: 'small' | 'medium' | 'large' | 'full' (default: 'medium')
- `as`: 'div' | 'main' | 'article' | 'section' (default: 'div')
- Extends all standard HTML div attributes

**Usage:**
```tsx
import { Container } from '@/components/common';

// Medium container (1200px max)
<Container>
  <h1>CrossFit Comet</h1>
</Container>

// Small container for forms/content
<Container size="small">
  <form>...</form>
</Container>

// Full width container
<Container size="full">
  <div>Full width content</div>
</Container>
```

**Sizes:**
- **small**: 768px max-width
- **medium**: 1200px max-width
- **large**: 1440px max-width
- **full**: 100% width with horizontal padding

**Features:**
- Responsive horizontal padding (1.5rem desktop, 1rem mobile)
- Container queries enabled for nested responsive design
- Centered with margin auto

---

## Import Pattern

All common components can be imported from a single location:

```tsx
import { Button, Card, Section, Container } from '@/components/common';

// Or individual imports
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
```

## Styling

All components use:
- **CSS Modules** for scoped styling
- **SCSS** with design system variables
- **CSS Custom Properties** for theming
- **Container Queries** for responsive design

### Design Tokens

From `_variables.scss`:

```scss
--color-bg: #181820           // Main background
--color-bg-light: #2a2a38     // Lighter background
--color-bg-dark: #0f0f14      // Darker background
--color-surface: #23232e      // Card/surface color
--color-accent: #ff4f1f       // Primary orange
--color-accent2: #ff1f4f      // Secondary red
--color-text: #fff            // Text color
--color-muted: #888           // Muted text

--font-header: 'Oswald'       // Bold headers
--font-body: 'Inter'          // Body text
```

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- Focus visible states
- Keyboard navigation support
- ARIA attributes where appropriate
- Color contrast compliance

## TypeScript

All components are fully typed with:
- Explicit prop interfaces
- Type exports for composition
- Extends native HTML attributes
- Type-safe variants using string literals

## Best Practices

### Composition

Build complex UIs by composing simple components:

```tsx
<Section spacing="large" background="surface">
  <Container>
    <Card variant="elevated" hoverable>
      <h3>CrossFit Fundamentals</h3>
      <p>Learn the basics of CrossFit movements</p>
      <Button variant="primary" fullWidth>
        Learn More
      </Button>
    </Card>
  </Container>
</Section>
```

### Variants

Use variants consistently:
- Primary buttons for main actions
- Secondary/outline for alternative actions
- Elevated cards for important content
- Dark sections for visual breaks

### Spacing

Establish visual rhythm:
- Use Section spacing for vertical rhythm
- Use Container for horizontal constraints
- Use Card padding for content spacing
- Maintain consistent gaps in layouts

## Next Steps

Future component additions:
- Grid system component
- Image component with lazy loading
- Input/Form components
- Modal/Dialog
- Navbar enhancements
- Hero section component
- Program card component
- Coach card component
- Testimonial component
- FAQ accordion
- Schedule grid component

## Demo

See `src/pages/ComponentDemo.tsx` for live examples of all components.

Run the dev server to view:
```bash
npm run dev
```
