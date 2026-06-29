import type { Meta, StoryObj } from '@storybook/react-vite';
import GlassCard from './GlassCard';

const meta = {
  title: 'Common/GlassCard',
  component: GlassCard,
  argTypes: {
    blur: { control: 'inline-radio', options: ['subtle', 'normal', 'strong'] },
    tint: { control: 'inline-radio', options: ['neutral', 'accent', 'secondary'] },
    padding: { control: 'inline-radio', options: ['none', 'compact', 'normal', 'spacious'] },
    hoverable: { control: 'boolean' },
    glow: { control: 'boolean' },
  },
  args: {
    blur: 'normal',
    tint: 'accent',
    padding: 'normal',
    hoverable: true,
    glow: false,
    children: (
      <div>
        <h3 style={{ marginTop: 0 }}>This Week</h3>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>24 classes booked across the gym.</p>
      </div>
    ),
  },
} satisfies Meta<typeof GlassCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Secondary: Story = { args: { tint: 'secondary' } };
export const Neutral: Story = { args: { tint: 'neutral' } };
export const Glowing: Story = { args: { glow: true } };
export const StrongBlur: Story = { args: { blur: 'strong' } };
