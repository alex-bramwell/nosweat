import type { Meta, StoryObj } from '@storybook/react-vite';
import FeatureNotEnabled from './FeatureNotEnabled';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Common/FeatureNotEnabled',
  component: FeatureNotEnabled,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  argTypes: {
    feature: {
      control: 'select',
      options: ['class_booking', 'coach_profiles', 'wod_programming', 'service_booking'],
    },
  },
  args: { feature: 'coach_profiles' },
} satisfies Meta<typeof FeatureNotEnabled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
