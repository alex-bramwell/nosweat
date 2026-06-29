import type { Meta, StoryObj } from '@storybook/react-vite';
import DataManagement from './DataManagement';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

const meta = {
  title: 'Gym Admin/DataManagement',
  component: DataManagement,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof DataManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
