import type { Meta, StoryObj } from '@storybook/react-vite';
import GymSettings from './GymSettings';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

const meta = {
  title: 'Gym Admin/GymSettings',
  component: GymSettings,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof GymSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
