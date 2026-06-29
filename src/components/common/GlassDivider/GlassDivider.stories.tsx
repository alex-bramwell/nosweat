import type { Meta, StoryObj } from '@storybook/react-vite';
import GlassDivider from './GlassDivider';

const meta = {
  title: 'Common/GlassDivider',
  component: GlassDivider,
  argTypes: { gradient: { control: 'boolean' }, glow: { control: 'boolean' } },
  args: { gradient: true, glow: false },
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-muted)' }}>Above the divider</p>
        <Story />
        <p style={{ color: 'var(--color-muted)' }}>Below the divider</p>
      </div>
    ),
  ],
} satisfies Meta<typeof GlassDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {};
export const Glowing: Story = { args: { glow: true } };
export const Plain: Story = { args: { gradient: false } };
