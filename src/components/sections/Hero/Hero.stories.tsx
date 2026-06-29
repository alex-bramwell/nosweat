import type { Meta, StoryObj } from '@storybook/react-vite';
import Hero from './Hero';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
