import type { Meta, StoryObj } from '@storybook/react-vite';
import TrialModal from './TrialModal';
import { withProviders } from '../../../.storybook/decorators';

// Opens on the "What's included" step. The final card-setup step uses Stripe.
const meta = {
  title: 'Modals/TrialModal',
  component: TrialModal,
  parameters: { layout: 'fullscreen', auth: null },
  decorators: [withProviders],
  args: { isOpen: true, onClose: () => {} },
} satisfies Meta<typeof TrialModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
