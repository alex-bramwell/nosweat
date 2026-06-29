import type { Meta, StoryObj } from '@storybook/react-vite';
import Stats from './Stats';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Sections/Stats',
  component: Stats,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Stats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
