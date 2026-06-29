import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Common/Select',
  component: Select,
  args: {
    options: [
      { value: 'amrap', label: 'AMRAP' },
      { value: 'for-time', label: 'For Time' },
      { value: 'emom', label: 'EMOM' },
      { value: 'strength', label: 'Strength' },
    ],
    value: 'amrap',
    placeholder: 'Select workout type...',
    disabled: false,
    onChange: () => {},
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof Select>) => {
  const [value, setValue] = useState(args.value);
  return <div style={{ maxWidth: 280 }}><Select {...args} value={value} onChange={setValue} /></div>;
};

export const Default: Story = { render: (args) => <Interactive {...args} /> };
export const Disabled: Story = { args: { disabled: true }, render: (args) => <Interactive {...args} /> };
