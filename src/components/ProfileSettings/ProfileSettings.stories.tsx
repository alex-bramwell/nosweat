import type { Meta, StoryObj } from '@storybook/react-vite';
import ProfileSettings from './ProfileSettings';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Member/ProfileSettings',
  component: ProfileSettings,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof ProfileSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
