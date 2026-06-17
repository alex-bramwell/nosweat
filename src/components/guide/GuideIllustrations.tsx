import type { ComponentType } from 'react';
import SignUpIllustration from '../common/illustrations/SignUpIllustration';
import BrandingIllustration from '../common/illustrations/BrandingIllustration';
import FeatureTogglesIllustration from '../common/illustrations/FeatureTogglesIllustration';
import ScheduleIllustration from '../common/illustrations/ScheduleIllustration';
import WodIllustration from '../common/illustrations/WodIllustration';
import CoachProfileIllustration from '../common/illustrations/CoachProfileIllustration';
import DashboardIllustration from '../common/illustrations/DashboardIllustration';
import DayPassIllustration from '../common/illustrations/DayPassIllustration';
import ServiceBookingIllustration from '../common/illustrations/ServiceBookingIllustration';
import MemberManagementIllustration from '../common/illustrations/MemberManagementIllustration';
import AnalyticsIllustration from '../common/illustrations/AnalyticsIllustration';

interface IllustrationProps {
  className?: string;
}

export const ILLUSTRATIONS: Record<string, ComponentType<IllustrationProps>> = {
  signup: SignUpIllustration,
  branding: BrandingIllustration,
  toggles: FeatureTogglesIllustration,
  schedule: ScheduleIllustration,
  wod: WodIllustration,
  coachProfile: CoachProfileIllustration,
  dashboard: DashboardIllustration,
  dayPass: DayPassIllustration,
  serviceBooking: ServiceBookingIllustration,
  memberManagement: MemberManagementIllustration,
  analytics: AnalyticsIllustration,
};
