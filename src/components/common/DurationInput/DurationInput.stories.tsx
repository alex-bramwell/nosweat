import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import DurationInput from './DurationInput';

const meta = {
  title: 'Common/DurationInput',
  component: DurationInput,
  args: { value: '20 min', placeholder: '0', min: 0, max: 999, onChange: () => {} },
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof DurationInput>) => {
  const [value, setValue] = useState(args.value);
  return <div style={{ maxWidth: 220 }}><DurationInput {...args} value={value} onChange={setValue} /></div>;
};

export const Default: Story = { render: (args) => <Interactive {...args} /> };
