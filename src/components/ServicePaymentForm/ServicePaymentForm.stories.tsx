import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServicePaymentForm } from './ServicePaymentForm';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Modals/ServicePaymentForm',
  component: ServicePaymentForm,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: {
    clientSecret: 'pi_dummy_secret_storybook',
    paymentIntentId: 'pi_dummy',
    amount: 4500,
    onSuccess: () => {},
    onError: () => {},
    onCancel: () => {},
    bookingDetails: {
      serviceId: 'svc-1',
      coachId: 'coach-1',
      memberId: 'user-1',
      bookingDate: '2026-07-02',
      startTime: '14:00',
      endTime: '15:00',
      notes: 'First session - focus on movement assessment.',
      coachName: 'Sam Rivera',
      serviceType: 'pt',
      hourlyRate: 45,
    },
  },
} satisfies Meta<typeof ServicePaymentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
