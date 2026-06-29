import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';

const meta = {
  title: 'Common/Button',
  component: Button,
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost'] },
    size: { control: 'inline-radio', options: ['compact', 'default', 'prominent'] },
    fullWidth: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Book a Class',
    variant: 'primary',
    size: 'default',
    fullWidth: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Manage billing' } };
export const Outline: Story = { args: { variant: 'outline', children: 'View Schedule' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Reset' } };
export const Prominent: Story = { args: { size: 'prominent', children: 'Start Your Free Trial' } };
export const Compact: Story = { args: { size: 'compact', children: 'Edit' } };
export const FullWidth: Story = { args: { fullWidth: true, children: 'Join Unlimited' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
