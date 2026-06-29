import type { Meta, StoryObj } from '@storybook/react-vite';
import Card from './Card';

const meta = {
  title: 'Common/Card',
  component: Card,
  argTypes: {
    variant: { control: 'inline-radio', options: ['flat', 'raised', 'outlined'] },
    padding: { control: 'inline-radio', options: ['none', 'compact', 'normal', 'spacious'] },
    hoverable: { control: 'boolean' },
  },
  args: {
    variant: 'raised',
    padding: 'normal',
    hoverable: false,
    children: (
      <div>
        <h3 style={{ marginTop: 0 }}>Unlimited Membership</h3>
        <p style={{ color: 'var(--color-muted)' }}>
          Train as often as you like, every day of the week.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Raised: Story = {};
export const Flat: Story = { args: { variant: 'flat' } };
export const Outlined: Story = { args: { variant: 'outlined' } };
export const Hoverable: Story = { args: { hoverable: true } };
