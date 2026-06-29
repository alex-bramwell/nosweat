import type { Meta, StoryObj } from '@storybook/react-vite';
import { Elements } from '@stripe/react-stripe-js';
import CardFields from './CardFields';
import { stripePromise } from '../../../lib/stripe';

// CardFields renders Stripe Element iframes, so it must live inside <Elements>.
// The Storybook config injects a fake test publishable key so Stripe.js loads
// and the fields mount (real charges would fail, which is fine for a preview).
const meta = {
  title: 'Common/CardFields',
  component: CardFields,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Elements stripe={stripePromise}>
          <Story />
        </Elements>
      </div>
    ),
  ],
} satisfies Meta<typeof CardFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
