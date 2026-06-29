import type { Meta, StoryObj } from '@storybook/react-vite';
import StatCard from './StatCard';

const meta = {
  title: 'Common/StatCard',
  component: StatCard,
  argTypes: {
    gradient: { control: 'inline-radio', options: ['accent', 'secondary'] },
    animate: { control: 'boolean' },
  },
  args: { value: 24, suffix: '+', label: 'Weekly Classes', gradient: 'accent', animate: true },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Secondary: Story = { args: { value: 8, suffix: '', label: 'Certified Coaches', gradient: 'secondary' } };

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <StatCard value={350} suffix="+" label="Active Members" />
      <StatCard value={92} suffix="%" label="Retention" gradient="secondary" />
      <StatCard value={6} label="Years Strong" />
    </div>
  ),
};
