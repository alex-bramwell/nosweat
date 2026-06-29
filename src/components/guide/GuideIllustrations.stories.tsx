import type { Meta, StoryObj } from '@storybook/react-vite';
import { ILLUSTRATIONS } from './GuideIllustrations';

const meta = { title: 'Guide/Illustrations' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {Object.entries(ILLUSTRATIONS).map(([key, Illustration]) => (
        <figure key={key} style={{ margin: 0 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius)', padding: '1rem' }}>
            <Illustration className="" />
          </div>
          <figcaption style={{ marginTop: '0.5rem', color: 'var(--color-muted)', fontSize: 13 }}>{key}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
