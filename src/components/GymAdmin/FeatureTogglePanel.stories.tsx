import type { Meta, StoryObj } from '@storybook/react-vite';
import FeatureTogglePanel from './FeatureTogglePanel';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

const meta = {
  title: 'Gym Admin/FeatureTogglePanel',
  component: FeatureTogglePanel,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof FeatureTogglePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
