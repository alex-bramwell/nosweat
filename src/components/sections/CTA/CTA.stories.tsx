import type { Meta, StoryObj } from '@storybook/react-vite';
import CTA from './CTA';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Sections/CTA',
  component: CTA,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof CTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
