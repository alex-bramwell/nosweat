import type { Meta, StoryObj } from '@storybook/react-vite';
import Section from './Section';

const meta = {
  title: 'Common/Section',
  component: Section,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    spacing: { control: 'inline-radio', options: ['none', 'tight', 'normal', 'relaxed', 'generous'] },
    background: { control: 'inline-radio', options: ['default', 'surface', 'bold'] },
    fullWidth: { control: 'boolean' },
    as: { control: 'inline-radio', options: ['section', 'div', 'article'] },
  },
  args: {
    spacing: 'normal',
    background: 'surface',
    fullWidth: false,
    children: (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Our Programs</h2>
        <p style={{ color: 'var(--color-muted)' }}>A vertical layout band with configurable spacing and background.</p>
      </div>
    ),
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Surface: Story = {};
export const Default: Story = { args: { background: 'default' } };
export const Bold: Story = { args: { background: 'bold' } };
export const Generous: Story = { args: { spacing: 'generous' } };
