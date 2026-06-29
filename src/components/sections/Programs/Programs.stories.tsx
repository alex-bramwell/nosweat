import type { Meta, StoryObj } from '@storybook/react-vite';
import Programs from './Programs';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Sections/Programs',
  component: Programs,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Programs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
