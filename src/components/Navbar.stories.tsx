import type { Meta, StoryObj } from '@storybook/react-vite';
import Navbar from './Navbar';
import { withProviders } from '../../.storybook/decorators';
import { mockAdminUser } from '../../.storybook/mockData';

const meta = {
  title: 'Layout/Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Logged-out visitor: shows the "Sign In" button.
export const LoggedOut: Story = { parameters: { auth: null } };

// Logged-in member: shows the user dropdown.
export const LoggedInMember: Story = {};

// Admin: dropdown also exposes Admin View / Coach View.
export const LoggedInAdmin: Story = { parameters: { auth: mockAdminUser } };
