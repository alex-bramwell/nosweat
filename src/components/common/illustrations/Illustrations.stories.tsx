import type { Meta, StoryObj } from '@storybook/react-vite';
import AnalyticsIllustration from './AnalyticsIllustration';
import BrandingIllustration from './BrandingIllustration';
import CoachProfileIllustration from './CoachProfileIllustration';
import DashboardIllustration from './DashboardIllustration';
import DayPassIllustration from './DayPassIllustration';
import FeatureTogglesIllustration from './FeatureTogglesIllustration';
import MemberManagementIllustration from './MemberManagementIllustration';
import PaymentFlowIllustration from './PaymentFlowIllustration';
import ScheduleIllustration from './ScheduleIllustration';
import ServiceBookingIllustration from './ServiceBookingIllustration';
import SignUpIllustration from './SignUpIllustration';
import WodIllustration from './WodIllustration';

const ALL = [
  ['Analytics', AnalyticsIllustration],
  ['Branding', BrandingIllustration],
  ['Coach Profile', CoachProfileIllustration],
  ['Dashboard', DashboardIllustration],
  ['Day Pass', DayPassIllustration],
  ['Feature Toggles', FeatureTogglesIllustration],
  ['Member Management', MemberManagementIllustration],
  ['Payment Flow', PaymentFlowIllustration],
  ['Schedule', ScheduleIllustration],
  ['Service Booking', ServiceBookingIllustration],
  ['Sign Up', SignUpIllustration],
  ['WOD', WodIllustration],
] as const;

const meta = {
  title: 'Common/Illustrations',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <figure style={{ margin: 0 }}>
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--border-radius)', padding: '1rem' }}>{children}</div>
    <figcaption style={{ marginTop: '0.5rem', color: 'var(--color-muted)', fontSize: 13 }}>{label}</figcaption>
  </figure>
);

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {ALL.map(([label, Illustration]) => (
        <Cell key={label} label={label}>
          <Illustration className="" />
        </Cell>
      ))}
    </div>
  ),
};
