import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceBookingModal } from './ServiceBookingModal';
import { withProviders } from '../../../.storybook/decorators';
import { mockCoachService } from '../../../.storybook/mockData';

const meta = {
  title: 'Modals/ServiceBookingModal',
  component: ServiceBookingModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { service: mockCoachService, memberId: 'user-1', onClose: () => {}, onSuccess: () => {} },
} satisfies Meta<typeof ServiceBookingModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
