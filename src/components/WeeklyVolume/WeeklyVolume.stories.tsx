import type { Meta, StoryObj } from '@storybook/react-vite';
import { WeeklyVolume } from './WeeklyVolume';
import { withProviders } from '../../../.storybook/decorators';

// NOTE: WeeklyVolume fetches analytics on mount; without a live backend in
// Storybook it renders its empty state. Included so the component is catalogued.
const meta = {
  title: 'Coach/WeeklyVolume',
  component: WeeklyVolume,
  decorators: [withProviders],
} satisfies Meta<typeof WeeklyVolume>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
