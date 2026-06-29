import type { Meta, StoryObj } from '@storybook/react-vite';
import Container from './Container';

const meta = {
  title: 'Common/Container',
  component: Container,
  argTypes: {
    size: { control: 'inline-radio', options: ['contentNarrow', 'contentStandard', 'contentWide', 'contentFull'] },
    as: { control: 'inline-radio', options: ['div', 'main', 'article', 'section'] },
  },
  args: {
    size: 'contentStandard',
    as: 'div',
    children: (
      <div style={{ background: 'rgba(var(--color-accent-rgb), 0.12)', padding: '1rem', borderRadius: 'var(--border-radius)' }}>
        Container content sits inside a max-width wrapper. Resize the canvas to see it respond.
      </div>
    ),
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};
export const Narrow: Story = { args: { size: 'contentNarrow' } };
export const Wide: Story = { args: { size: 'contentWide' } };
export const Full: Story = { args: { size: 'contentFull' } };
