import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusBadge from './StatusBadge';

const meta = {
  title: 'Common/StatusBadge',
  component: StatusBadge,
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'warning', 'success', 'error'] },
    label: { control: 'text' },
  },
  args: { label: 'Active', variant: 'success' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};
export const Warning: Story = { args: { label: 'Pending DNS', variant: 'warning' } };
export const ErrorState: Story = { args: { label: 'Failed', variant: 'error' } };
export const Default: Story = { args: { label: 'Draft', variant: 'default' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <StatusBadge label="Active" variant="success" />
      <StatusBadge label="Pending DNS" variant="warning" />
      <StatusBadge label="Failed" variant="error" />
      <StatusBadge label="Not Configured" variant="default" />
    </div>
  ),
};
