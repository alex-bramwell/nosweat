import type { Meta, StoryObj } from '@storybook/react-vite';
import Footer from './Footer';
import { withProviders } from '../../.storybook/decorators';

const meta = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
