import type { Meta, StoryObj } from '@storybook/react-vite';
import TrialBanner from './TrialBanner';
import { withProviders } from '../../../.storybook/decorators';
import { mockGym } from '../../../.storybook/mockData';

const meta = {
  title: 'Common/TrialBanner',
  component: TrialBanner,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof TrialBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Active trial: banner shows days remaining + member limit.
export const ActiveTrial: Story = {
  parameters: {
    tenant: {
      gym: {
        ...mockGym,
        trial_status: 'active',
        trial_start_date: '2026-06-20',
        trial_end_date: '2026-07-04',
      },
    },
  },
};

// Expired trial: banner prompts upgrade.
export const ExpiredTrial: Story = {
  parameters: {
    tenant: {
      gym: { ...mockGym, trial_status: 'expired', trial_end_date: '2026-06-10' },
    },
  },
};
