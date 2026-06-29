import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeDomainChart } from './TimeDomainChart';

const meta = {
  title: 'Coach/Charts/TimeDomainChart',
  component: TimeDomainChart,
  args: {
    data: [
      { domain: 'Sprint', count: 4, percentage: 18 },
      { domain: 'Short', count: 8, percentage: 36 },
      { domain: 'Medium', count: 7, percentage: 32 },
      { domain: 'Long', count: 3, percentage: 14 },
    ],
  },
} satisfies Meta<typeof TimeDomainChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
