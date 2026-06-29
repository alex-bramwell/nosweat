import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserManagement } from './UserManagement';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

// NOTE: fetches the member list on mount; without a backend the table is empty,
// but the header, search and invite controls are reviewable.
const meta = {
  title: 'Gym Admin/UserManagement',
  component: UserManagement,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof UserManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Members: Story = { args: { title: 'Manage Members', fixedRoleFilter: 'member' } };
export const Staff: Story = { args: { title: 'Manage Staff', fixedRoleFilter: ['staff', 'coach'] } };
