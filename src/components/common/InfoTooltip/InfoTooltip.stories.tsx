import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoTooltip } from './InfoTooltip';

const meta = {
  title: 'Common/InfoTooltip',
  component: InfoTooltip,
  args: {
    content: 'Balance shows how evenly your programming hits each muscle group. green is balanced, red is overused.',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Programming balance</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
