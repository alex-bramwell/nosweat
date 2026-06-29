import type { Meta, StoryObj } from '@storybook/react-vite';
import BuilderSidebar from './BuilderSidebar';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Gym Admin/BuilderSidebar',
  component: BuilderSidebar,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { activePage: '/', viewAsRole: 'admin' },
} satisfies Meta<typeof BuilderSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
