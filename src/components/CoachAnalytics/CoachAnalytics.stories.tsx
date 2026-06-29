import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoachAnalytics } from './CoachAnalytics';
import { withProviders } from '../../../.storybook/decorators';
import { mockCoachUser } from '../../../.storybook/mockData';

// NOTE: pulls analytics from the backend on mount; without a live database in
// Storybook it shows its empty/sample state with the period switcher and chart
// scaffolding intact.
const meta = {
  title: 'Coach/CoachAnalytics',
  component: CoachAnalytics,
  parameters: { layout: 'fullscreen', auth: mockCoachUser },
  decorators: [withProviders],
} satisfies Meta<typeof CoachAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
