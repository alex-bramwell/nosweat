import type { Meta, StoryObj } from '@storybook/react-vite';
import DayPassPaymentModal from './DayPassPaymentModal';
import { withProviders } from '../../../.storybook/decorators';

// NOTE: creates a Stripe payment intent on open. Without a backend it lands on
// its error/retry state, but the class summary and modal layout are reviewable.
const meta = {
  title: 'Modals/DayPassPaymentModal',
  component: DayPassPaymentModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: {
    isOpen: true,
    onClose: () => {},
    userId: 'user-1',
    selectedClass: { id: 'sch-0-1', day: 'Monday', time: '06:00', className: 'Group Class', coach: 'Sam Rivera' },
  },
} satisfies Meta<typeof DayPassPaymentModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
