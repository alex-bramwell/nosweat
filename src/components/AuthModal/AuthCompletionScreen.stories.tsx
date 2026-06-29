import type { Meta, StoryObj } from '@storybook/react-vite';
import AuthCompletionScreen from './AuthCompletionScreen';

const meta = {
  title: 'Auth/AuthCompletionScreen',
  component: AuthCompletionScreen,
  args: {
    icon: <span style={{ fontSize: '2.5rem' }}>✅</span>,
    title: 'Account Created Successfully!',
    message: (
      <>
        We&apos;ve sent a verification email to <strong>alex@example.com</strong>
      </>
    ),
    steps: [
      { title: 'Check your email', description: 'Look for an email from Iron Forge Fitness' },
      { title: 'Verify your account', description: 'Click the verification link in the email' },
      { title: 'Sign in and start training', description: 'Access your dashboard and begin your journey' },
    ],
    note: "Didn't receive the email? Check your spam folder or contact us for help.",
    buttonLabel: 'Got It',
    onAcknowledge: () => {},
  },
} satisfies Meta<typeof AuthCompletionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignupSuccess: Story = {};

export const PasswordResetSent: Story = {
  args: {
    icon: <span style={{ fontSize: '2.5rem' }}>📧</span>,
    title: 'Reset Email Sent!',
    message: (
      <>
        We&apos;ve sent password reset instructions to <strong>alex@example.com</strong>
      </>
    ),
    steps: [
      { title: 'Check your email', description: 'Look for a password reset email' },
      { title: 'Click the reset link', description: 'Follow the secure link to create a new password' },
      { title: 'Sign in with new password', description: 'Return here and log in' },
    ],
  },
};
