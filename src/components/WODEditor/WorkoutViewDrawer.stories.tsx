import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkoutViewDrawer } from './WorkoutViewDrawer';
import { mockWorkout } from '../../../.storybook/mockData';

const meta = {
  title: 'Coach/WorkoutViewDrawer',
  component: WorkoutViewDrawer,
  parameters: { layout: 'fullscreen' },
  args: {
    workout: mockWorkout,
    maxCapacity: 20,
    canEdit: true,
    onEdit: () => {},
    onClose: () => {},
    bookings: [
      { id: 'b1', workoutId: 'wod-1', userId: 'u1', status: 'booked', bookedAt: '2026-06-29T05:30:00Z', userName: 'Alex Morgan', userEmail: 'alex@example.com' },
      { id: 'b2', workoutId: 'wod-1', userId: 'u2', status: 'booked', bookedAt: '2026-06-29T05:32:00Z', userName: 'Jordan Blake', userEmail: 'jordan@example.com' },
      { id: 'b3', workoutId: 'wod-1', userId: 'u3', status: 'attended', bookedAt: '2026-06-29T05:35:00Z', userName: 'Sam Rivera', userEmail: 'sam@example.com' },
    ],
  },
} satisfies Meta<typeof WorkoutViewDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBookings: Story = {};
export const NoBookings: Story = { args: { bookings: [] } };
export const ReadOnly: Story = { args: { canEdit: false } };
