import type { Meta, StoryObj } from '@storybook/react-vite';
import { MovementBuilder } from './MovementBuilder';

// NOTE: MovementBuilder loads its movement library from the backend on mount.
// Without a live database in Storybook the grid is empty, but the search bar,
// muscle-group filters and section header are fully reviewable.
const meta = {
  title: 'Coach/MovementBuilder',
  component: MovementBuilder,
  args: { section: 'metcon', onAddMovement: () => {} },
} satisfies Meta<typeof MovementBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
