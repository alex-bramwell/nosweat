import { authFetch } from '../lib/auth';

export interface PlatformSubscriptionResult {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  status: string;
}

// Manage a gym's noSweat platform subscription. Cancel keeps access until the
// end of the paid period (cancel_at_period_end) and stops future billing;
// resume clears that pending cancellation.
export const platformSubscriptionService = {
  async cancel(gymId: string): Promise<PlatformSubscriptionResult> {
    return authFetch<PlatformSubscriptionResult>(
      '/api/subscriptions/cancel-platform-subscription',
      { gymId }
    );
  },

  async resume(gymId: string): Promise<PlatformSubscriptionResult> {
    return authFetch<PlatformSubscriptionResult>(
      '/api/subscriptions/cancel-platform-subscription',
      { gymId, resume: true }
    );
  },
};
