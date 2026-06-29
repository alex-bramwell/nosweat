import type { Meta, StoryObj } from '@storybook/react-vite';
import MembershipsPanel from './MembershipsPanel';
import { withProviders } from '../../../.storybook/decorators';
import { mockAdminUser } from '../../../.storybook/mockData';

// NOTE: loads plans/promos from the backend on mount; in Storybook those lists
// start empty, but the day-pass price card and "add plan" flow are reviewable.
const meta = {
  title: 'Gym Admin/MembershipsPanel',
  component: MembershipsPanel,
  parameters: { layout: 'fullscreen', auth: mockAdminUser },
  decorators: [withProviders],
} satisfies Meta<typeof MembershipsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
