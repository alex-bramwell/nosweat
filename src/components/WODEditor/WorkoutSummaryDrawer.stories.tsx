import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutSummaryDrawer } from './WorkoutSummaryDrawer';
import { mockSectionMovements } from '../../../.storybook/mockData';

const meta = {
  title: 'Coach/WorkoutSummaryDrawer',
  component: WorkoutSummaryDrawer,
  args: { sectionMovements: mockSectionMovements, onRemoveMovement: () => {} },
} satisfies Meta<typeof WorkoutSummaryDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { sectionMovements: { warmup: [], strength: [], metcon: [], cooldown: [] } },
};
