import type { Meta, StoryObj } from '@storybook/react-vite';
import DayPassModal from './DayPassModal';
import { withProviders } from '../../../.storybook/decorators';

// Opens at step 1. Later steps (class select, payment) use Stripe + the backend.
const meta = {
  title: 'Modals/DayPassModal',
  component: DayPassModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { isOpen: true, onClose: () => {} },
} satisfies Meta<typeof DayPassModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Logged out -> opens on the sign-in step.
export const SignInStep: Story = { parameters: { auth: null } };

// Logged in -> opens on the class-selection step.
export const ClassSelection: Story = {};
