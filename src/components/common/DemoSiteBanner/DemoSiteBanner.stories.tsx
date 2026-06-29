import type { Meta, StoryObj } from '@storybook/react-vite';
import DemoSiteBanner from './DemoSiteBanner';

const meta = {
  title: 'Common/DemoSiteBanner',
  component: DemoSiteBanner,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DemoSiteBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
