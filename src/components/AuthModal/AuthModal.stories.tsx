import type { Meta, StoryObj } from '@storybook/react-vite';
import AuthModal from './AuthModal';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Modals/AuthModal',
  component: AuthModal,
  parameters: { layout: 'fullscreen', auth: null },
  decorators: [withProviders],
  args: { isOpen: true, onClose: () => {} },
} satisfies Meta<typeof AuthModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = { args: { initialMode: 'login' } };
export const Signup: Story = { args: { initialMode: 'signup' } };
export const ResetPassword: Story = { args: { initialMode: 'reset' } };
export const CoachLogin: Story = { args: { initialMode: 'login', isCoachLogin: true } };
