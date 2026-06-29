import type { Meta, StoryObj } from '@storybook/react-vite';
import CloseButton from './CloseButton';

const meta = {
  title: 'Common/CloseButton',
  component: CloseButton,
  args: { 'aria-label': 'Close', onClick: () => {} },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 240, height: 120, background: 'var(--color-surface)', borderRadius: 'var(--border-radius)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CloseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AsLink: Story = { args: { onClick: undefined, href: '#', 'aria-label': 'Close dialog' } };
