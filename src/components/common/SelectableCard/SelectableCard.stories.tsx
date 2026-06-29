import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SelectableCard from './SelectableCard';

const meta = {
  title: 'Common/SelectableCard',
  component: SelectableCard,
  args: {
    icon: <span style={{ fontSize: '1.75rem' }}>🎫</span>,
    title: 'I already have a domain',
    description: 'I own a domain and want to connect it to my gym site.',
    onClick: fn(),
  },
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoIcon: Story = { args: { icon: undefined, title: 'Open Gym', description: 'Drop in and train on your own schedule.' } };

export const Pair: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <SelectableCard icon={<span style={{ fontSize: '1.75rem' }}>➕</span>} title="I need a new domain" description="I don't have a domain yet and need to register one." onClick={fn()} />
      <SelectableCard icon={<span style={{ fontSize: '1.75rem' }}>🔗</span>} title="I already have a domain" description="Connect a domain you already own." onClick={fn()} />
    </div>
  ),
};
