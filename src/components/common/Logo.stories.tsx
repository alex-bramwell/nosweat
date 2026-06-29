import type { Meta, StoryObj } from '@storybook/react-vite';
import Logo from './Logo';

const meta = {
  title: 'Common/Logo',
  component: Logo,
  render: (args) => (
    <div style={{ color: 'var(--color-text)', fontSize: 32 }}>
      <Logo {...args} />
    </div>
  ),
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Accent: Story = {
  render: () => (
    <div style={{ color: 'var(--color-accent)', fontSize: 48 }}>
      <Logo />
    </div>
  ),
};
