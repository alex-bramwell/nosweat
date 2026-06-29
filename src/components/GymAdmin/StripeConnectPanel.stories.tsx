import type { Meta, StoryObj } from '@storybook/react-vite';
import StripeConnectPanel from './StripeConnectPanel';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

// NOTE: checks Stripe account status via the API on mount; without a backend in
// Storybook it shows its initial/connect state.
const meta = {
  title: 'Gym Admin/StripeConnectPanel',
  component: StripeConnectPanel,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof StripeConnectPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
