import type { Meta, StoryObj } from '@storybook/react-vite';
import StripeCardSetupForm from './StripeCardSetupForm';
import { withProviders } from '../../../.storybook/decorators';

// NOTE: requests a Stripe setup intent on mount. Without a backend the card
// fields still render via the fake publishable key configured for Storybook.
const meta = {
  title: 'Modals/StripeCardSetupForm',
  component: StripeCardSetupForm,
  decorators: [withProviders],
  args: { userId: 'user-1', gymId: 'gym-1', onSuccess: () => {}, onError: () => {} },
} satisfies Meta<typeof StripeCardSetupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
