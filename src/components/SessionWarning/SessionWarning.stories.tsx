import type { Meta, StoryObj } from '@storybook/react-vite';
import SessionWarning from './SessionWarning';

const meta = {
  title: 'Modals/SessionWarning',
  component: SessionWarning,
  parameters: { layout: 'fullscreen' },
  args: { isOpen: true, remainingTime: '5 minutes', onExtend: () => {}, onLogout: () => {} },
} satisfies Meta<typeof SessionWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
