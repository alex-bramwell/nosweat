import type { Meta, StoryObj } from '@storybook/react-vite';
import FeatureGate from './FeatureGate';
import Card from '../Card/Card';
import FeatureNotEnabled from './FeatureNotEnabled';
import { withProviders } from '../../../../.storybook/decorators';
import { allFeaturesOff } from '../../../../.storybook/mockData';

const meta = {
  title: 'Common/FeatureGate',
  component: FeatureGate,
  decorators: [withProviders],
  args: {
    feature: 'class_booking',
    children: <Card variant="raised">Class booking content (feature is ON)</Card>,
  },
} satisfies Meta<typeof FeatureGate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Feature enabled (decorator defaults all features on) -> children render.
export const Enabled: Story = {};

// Feature disabled -> fallback renders instead.
export const DisabledWithFallback: Story = {
  parameters: { tenant: { features: allFeaturesOff } },
  args: { fallback: <FeatureNotEnabled feature="class_booking" /> },
};
