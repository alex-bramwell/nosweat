import type { Meta, StoryObj } from '@storybook/react-vite';
import { WODEditorEnhanced } from './WODEditorEnhanced';

const meta = {
  title: 'Coach/WODEditor',
  component: WODEditorEnhanced,
  parameters: { layout: 'fullscreen' },
  args: { onSave: () => {}, onCancel: () => {} },
} satisfies Meta<typeof WODEditorEnhanced>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewWorkout: Story = {};

export const EditingWorkout: Story = {
  args: {
    isEditing: true,
    initialData: {
      date: '2026-06-29',
      title: 'Hump Day Hero',
      description: 'A classic couplet to test the engine and the legs.',
      workoutType: 'fortime',
      duration: '20 min',
      movements: ['21-15-9 Thrusters', '21-15-9 Pull-ups'],
      metcon: ['21-15-9: Thrusters (43/30kg)', '21-15-9: Pull-ups'],
      status: 'published',
    },
  },
};
