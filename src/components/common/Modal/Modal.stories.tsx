import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Modal from './Modal';
import Button from '../Button/Button';

const meta = {
  title: 'Common/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    size: { control: 'inline-radio', options: ['compact', 'default', 'wide', 'fullscreen'] },
  },
  args: { size: 'default', isOpen: true, onClose: () => {}, children: null },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const DemoBody = () => (
  <div style={{ padding: '2rem' }}>
    <h2 style={{ marginTop: 0 }}>Start Your Free Trial</h2>
    <p style={{ color: 'var(--color-muted)' }}>
      Experience the Iron Forge difference with no commitment. Your first class is on us.
    </p>
    <Button variant="primary" fullWidth>Continue to Create Account</Button>
  </div>
);

// Interactive: open/close with a trigger button.
const Interactive = (args: React.ComponentProps<typeof Modal>) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: '2rem' }}>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal {...args} isOpen={open} onClose={() => setOpen(false)}>
        <DemoBody />
      </Modal>
    </div>
  );
};

export const Default: Story = { render: (args) => <Interactive {...args} /> };

// Always-open variants so the chrome is visible in the docs grid.
export const Compact: Story = { args: { size: 'compact' }, render: (args) => <Modal {...args} onClose={() => {}}><DemoBody /></Modal> };
export const Wide: Story = { args: { size: 'wide' }, render: (args) => <Modal {...args} onClose={() => {}}><DemoBody /></Modal> };
export const Fullscreen: Story = { args: { size: 'fullscreen' }, render: (args) => <Modal {...args} onClose={() => {}}><DemoBody /></Modal> };
