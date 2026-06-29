import type { Meta, StoryObj } from '@storybook/react-vite';
import RouteFallback from './RouteFallback';

const meta = {
  title: 'Common/RouteFallback',
  component: RouteFallback,
} satisfies Meta<typeof RouteFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
