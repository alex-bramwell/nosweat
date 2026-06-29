import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import NumberInput from './NumberInput';

const meta = {
  title: 'Common/NumberInput',
  component: NumberInput,
  args: { value: 5, min: 0, max: 999, step: 1, label: 'reps', onChange: () => {} },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof NumberInput>) => {
  const [value, setValue] = useState<number | undefined>(args.value);
  return <div style={{ maxWidth: 220 }}><NumberInput {...args} value={value} onChange={setValue} /></div>;
};

export const Default: Story = { render: (args) => <Interactive {...args} /> };
export const Weight: Story = { args: { value: 60, label: 'kg', step: 5, max: 300 }, render: (args) => <Interactive {...args} /> };
