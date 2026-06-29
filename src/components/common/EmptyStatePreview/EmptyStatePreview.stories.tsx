import type { Meta, StoryObj } from '@storybook/react-vite';
import EmptyStatePreview from './EmptyStatePreview';
import Card from '../Card/Card';
import Button from '../Button/Button';

const meta = {
  title: 'Common/EmptyStatePreview',
  component: EmptyStatePreview,
  args: {
    title: 'Memberships',
    description: 'This is sample content. Add your own plans to replace it.',
    children: (
      <Card variant="outlined">
        <h3 style={{ marginTop: 0 }}>Unlimited - £69/month</h3>
        <p style={{ color: 'var(--color-muted)' }}>Unlimited access to all classes.</p>
      </Card>
    ),
  },
} satisfies Meta<typeof EmptyStatePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = { args: { action: <Button size="compact">Add a plan</Button> } };
