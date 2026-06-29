import type { Meta, StoryObj } from '@storybook/react-vite';
import PlatformBillingPanel from './PlatformBillingPanel';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

const meta = {
  title: 'Gym Admin/PlatformBillingPanel',
  component: PlatformBillingPanel,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof PlatformBillingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
