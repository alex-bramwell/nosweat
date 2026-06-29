import type { Meta, StoryObj } from '@storybook/react-vite';
import Memberships from './Memberships';
import { withProviders } from '../../../../.storybook/decorators';

const meta = {
  title: 'Sections/Memberships',
  component: Memberships,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof Memberships>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
