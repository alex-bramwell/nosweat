import type { Meta, StoryObj } from '@storybook/react-vite';
import AnimatedSection from './AnimatedSection';
import Card from '../Card/Card';

const meta = {
  title: 'Common/AnimatedSection',
  component: AnimatedSection,
  argTypes: {
    animation: { control: 'inline-radio', options: ['fadeInUp', 'fadeInScale', 'slideInRight', 'none'] },
    delay: { control: { type: 'number' } },
    stagger: { control: 'boolean' },
  },
  args: { animation: 'fadeInUp', delay: 0, stagger: false, children: null },
} satisfies Meta<typeof AnimatedSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FadeInUp: Story = {
  render: (args) => (
    <AnimatedSection {...args}>
      <Card variant="raised">
        <h3 style={{ marginTop: 0 }}>Reveals on scroll</h3>
        <p style={{ color: 'var(--color-muted)' }}>This block animates in when it enters the viewport.</p>
      </Card>
    </AnimatedSection>
  ),
};

export const Staggered: Story = {
  args: { stagger: true },
  render: (args) => (
    <AnimatedSection {...args}>
      {[1, 2, 3].map((n) => (
        <Card key={n} variant="raised" style={{ marginBottom: '0.75rem' }}>Item {n}</Card>
      ))}
    </AnimatedSection>
  ),
};
