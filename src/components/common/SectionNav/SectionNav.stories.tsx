import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SectionNav from './SectionNav';

const items = [
  { id: 'overview', label: 'Overview', done: true },
  { id: 'branding', label: 'Branding', done: true },
  { id: 'schedule', label: 'Schedule', done: false },
  { id: 'payments', label: 'Payments', done: false },
];

const meta = {
  title: 'Common/SectionNav',
  component: SectionNav,
  argTypes: { variant: { control: 'inline-radio', options: ['floating', 'inline'] } },
  args: { items, activeId: 'schedule', title: 'Setup', variant: 'inline', onSelect: () => {} },
} satisfies Meta<typeof SectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof SectionNav>) => {
  const [active, setActive] = useState(args.activeId);
  const wrap = args.variant === 'inline';
  const nav = <SectionNav {...args} activeId={active} onSelect={setActive} />;
  return wrap ? <div style={{ maxWidth: 320 }}>{nav}</div> : nav;
};

export const Inline: Story = { args: { meta: '2 of 4 done' }, render: (args) => <Interactive {...args} /> };
export const Floating: Story = { args: { variant: 'floating' }, render: (args) => <Interactive {...args} /> };
