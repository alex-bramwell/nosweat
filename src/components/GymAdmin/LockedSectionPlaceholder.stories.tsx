import type { Meta, StoryObj } from '@storybook/react-vite';
import LockedSectionPlaceholder from './LockedSectionPlaceholder';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Gym Admin/LockedSectionPlaceholder',
  component: LockedSectionPlaceholder,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  argTypes: {
    feature: { control: 'select', options: ['wod_programming', 'class_booking', 'coach_profiles', 'service_booking'] },
  },
  args: { feature: 'wod_programming' },
} satisfies Meta<typeof LockedSectionPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
