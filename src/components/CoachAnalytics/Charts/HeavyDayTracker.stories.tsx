import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeavyDayTracker } from './HeavyDayTracker';

const meta = {
  title: 'Coach/Charts/HeavyDayTracker',
  component: HeavyDayTracker,
  args: { count: 3, periodLabel: 'this week' },
} satisfies Meta<typeof HeavyDayTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TargetHit: Story = { args: { count: 4 } };
export const None: Story = { args: { count: 0 } };
