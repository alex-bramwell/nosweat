import type { Meta, StoryObj } from '@storybook/react-vite';
import FeatureIcon from './FeatureIcon';
import type { FeatureKey } from '../../types/tenant';

const KEYS: FeatureKey[] = [
  'class_booking', 'wod_programming', 'coach_profiles', 'day_passes',
  'trial_memberships', 'service_booking', 'coach_analytics', 'member_management', 'custom_domain',
];

const meta = {
  title: 'Common/FeatureIcon',
  component: FeatureIcon,
  argTypes: { featureKey: { control: 'select', options: KEYS } },
  args: { featureKey: 'class_booking' },
} satisfies Meta<typeof FeatureIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const AllFeatures: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
      {KEYS.map((k) => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 40, height: 40, color: 'var(--color-accent)' }}><FeatureIcon featureKey={k} /></span>
          <code style={{ fontSize: 12, color: 'var(--color-muted)' }}>{k}</code>
        </div>
      ))}
    </div>
  ),
};
