# Getting Started with CrossFit Comet Development

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Container/
│   │   └── Section/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Navbar.tsx          # Navigation component
│   └── Footer.tsx          # Footer component
├── pages/                   # Page components
│   └── ComponentDemo.tsx   # UI component showcase
├── styles/                  # Global styles
│   ├── _variables.scss     # Design tokens
│   └── globals.scss        # Global CSS
├── App.tsx                 # Main app component
└── main.tsx                # Application entry point
```

## Using the Component Library

### Import Components

```tsx
// Import all common components
import { Button, Card, Section, Container } from '@/components/common';

// Or import individually
import Button from '@/components/common/Button';
```

### Example: Build a Hero Section

```tsx
import { Section, Container, Button } from '@/components/common';

const Hero = () => (
  <Section spacing="xlarge" background="dark">
    <Container>
      <h1>Welcome to CrossFit Comet</h1>
      <p>Transform your fitness journey with us</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Button variant="primary" size="large">
          Book Free Trial
        </Button>
        <Button variant="outline" size="large">
          Learn More
        </Button>
      </div>
    </Container>
  </Section>
);
```

### Example: Build a Program Card

```tsx
import { Card, Button } from '@/components/common';

const ProgramCard = () => (
  <Card variant="elevated" hoverable>
    <h3>CrossFit Fundamentals</h3>
    <p>Perfect for beginners. Learn the core movements and build a strong foundation.</p>
    <ul>
      <li>12 sessions over 4 weeks</li>
      <li>Small group setting (max 6)</li>
      <li>Personalized coaching</li>
    </ul>
    <Button variant="primary" fullWidth>
      Sign Up
    </Button>
  </Card>
);
```

### Example: Build a Page Section

```tsx
import { Section, Container, Card } from '@/components/common';

const ProgramsSection = () => (
  <Section spacing="large" background="surface">
    <Container>
      <h2>Our Programs</h2>
      <p>Choose the program that fits your goals</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        <Card variant="elevated">
          <h3>CrossFit</h3>
          <p>High-intensity functional fitness</p>
        </Card>

        <Card variant="elevated">
          <h3>Foundations</h3>
          <p>Learn the basics with expert coaching</p>
        </Card>

        <Card variant="elevated">
          <h3>Open Gym</h3>
          <p>Train on your own schedule</p>
        </Card>
      </div>
    </Container>
  </Section>
);
```

## Design System

### Colors

```scss
--color-bg: #181820           // Dark background
--color-surface: #23232e      // Card backgrounds
--color-accent: #ff4f1f       // Primary orange (CTAs)
--color-accent2: #ff1f4f      // Secondary red
--color-text: #fff            // White text
```

### Typography

```scss
--font-header: 'Oswald'       // Bold, impactful headers
--font-body: 'Inter'          // Clean, readable body text
```

### Component Variants

**Buttons:**
- `primary` - Main CTAs (orange)
- `secondary` - Alternative actions
- `outline` - Less prominent CTAs
- `ghost` - Minimal style

**Cards:**
- `default` - Standard card
- `elevated` - With shadow
- `bordered` - With border

**Sections:**
- `default` - Main background (#181820)
- `surface` - Lighter (#23232e)
- `dark` - Darker (#0f0f14)

## Next Steps

### 1. Build Homepage Content Sections

Create these sections using your new components:
- Hero section with CTA
- Stats section (members, years, classes)
- Programs overview
- Daily WOD showcase
- Testimonials
- Final CTA section

### 2. Add Routing

Install React Router:
```bash
npm install react-router-dom
```

Set up routes for:
- Home (/)
- About (/about)
- Programs (/programs)
- Coaches (/coaches)
- Schedule (/schedule)
- Contact (/contact)

### 3. Create Specialized Components

Build domain-specific components:
- `Hero` component
- `ProgramCard` component
- `CoachCard` component
- `TestimonialCard` component
- `WODCard` component
- `ScheduleGrid` component
- `PricingCard` component

### 4. Add Interactivity

- Form handling for contact/signup
- Modal for booking trials
- Image galleries for facility/coaches
- FAQ accordion
- Mobile menu for navbar

## Best Practices

### Component Structure

```tsx
// 1. Type imports
import type { ReactNode } from 'react';

// 2. Component imports
import { Button, Card } from '@/components/common';

// 3. Styles
import styles from './Component.module.scss';

// 4. Type definitions
interface ComponentProps {
  title: string;
  children: ReactNode;
}

// 5. Component
const Component = ({ title, children }: ComponentProps) => (
  <div className={styles.component}>
    <h2>{title}</h2>
    {children}
  </div>
);

// 6. Export
export default Component;
```

### Styling with CSS Modules

```tsx
// Component.tsx
import styles from './Component.module.scss';

const Component = () => (
  <div className={styles.wrapper}>
    <h2 className={styles.title}>Title</h2>
  </div>
);
```

```scss
// Component.module.scss
@use '../../../styles/variables' as *;

.wrapper {
  padding: 2rem;
  background: var(--color-surface);
}

.title {
  @include header;
  color: var(--color-accent);
}
```

### TypeScript Best Practices

- Use `type` imports for type-only imports
- Define explicit prop interfaces
- Extend HTML attributes when appropriate
- Use string literals for variants
- Export types for composition

## Resources

- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - Detailed component documentation
- [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Git workflow and conventions
- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Demo Component

View the component library in action:

1. Update `App.tsx` to import ComponentDemo:
```tsx
import ComponentDemo from './pages/ComponentDemo';

function App() {
  return <ComponentDemo />;
}

export default App;
```

2. Start dev server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Questions?

- Check [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for component API docs
- Review [ComponentDemo.tsx](./src/pages/ComponentDemo.tsx) for usage examples
- Follow React best practices for component composition
- Use TypeScript for type safety
- Keep components small and focused
