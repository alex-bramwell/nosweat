import type { Meta, StoryObj } from '@storybook/react-vite';
import { FunctionalRadarChart } from './FunctionalRadarChart';

const meta = {
  title: 'Coach/Charts/FunctionalRadarChart',
  component: FunctionalRadarChart,
  args: {
    data: [
      { pattern: 'squat', count: 12, percentage: 22 },
      { pattern: 'hinge', count: 9, percentage: 16 },
      { pattern: 'push', count: 8, percentage: 15 },
      { pattern: 'pull', count: 10, percentage: 18 },
      { pattern: 'lunge', count: 5, percentage: 9 },
      { pattern: 'carry', count: 3, percentage: 6 },
      { pattern: 'core', count: 6, percentage: 11 },
      { pattern: 'monostructural', count: 2, percentage: 3 },
    ],
  },
} satisfies Meta<typeof FunctionalRadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
