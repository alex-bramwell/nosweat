import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import PasswordVisibilityToggle from './PasswordVisibilityToggle';

const meta = {
  title: 'Auth/PasswordVisibilityToggle',
  component: PasswordVisibilityToggle,
  args: { visible: false, onToggle: () => {} },
} satisfies Meta<typeof PasswordVisibilityToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const Interactive = (args: React.ComponentProps<typeof PasswordVisibilityToggle>) => {
  const [visible, setVisible] = useState(args.visible);
  return (
    <div style={{ position: 'relative', width: 260 }}>
      <input
        type={visible ? 'text' : 'password'}
        defaultValue="Sup3rSecret!"
        style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 0.6rem', borderRadius: 8 }}
      />
      <PasswordVisibilityToggle {...args} visible={visible} onToggle={() => setVisible((v) => !v)} />
    </div>
  );
};

export const Default: Story = { render: (args) => <Interactive {...args} /> };
