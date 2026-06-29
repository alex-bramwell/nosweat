import type { Meta, StoryObj } from '@storybook/react-vite';
import LockedFeatureOverlay from './LockedFeatureOverlay';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Gym Admin/LockedFeatureOverlay',
  component: LockedFeatureOverlay,
  decorators: [withProviders],
  argTypes: {
    feature: { control: 'select', options: ['day_passes', 'service_booking', 'coach_profiles', 'custom_domain'] },
  },
  args: { feature: 'day_passes' },
} satisfies Meta<typeof LockedFeatureOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
