import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/auth';

export interface MemberSubscription {
  id: string;
  gymId: string;
  membershipId: string | null;
  stripeSubscriptionId: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  // Joined membership plan details
  planName?: string;
  pricePence?: number | null;
  billingPeriod?: string | null;
}

export const subscriptionService = {
  /**
   * Get the member's current (non-cancelled) subscription for a gym, with the
   * membership plan details joined in for display.
   */
  async getActiveSubscription(
    userId: string,
    gymId: string
  ): Promise<MemberSubscription | null> {
    const { data, error } = await supabase
      .from('member_subscriptions')
      .select(`
        id,
        gym_id,
        membership_id,
        stripe_subscription_id,
        status,
        current_period_end,
        cancel_at_period_end,
        gym_memberships (
          display_name,
          price_pence,
          billing_period
        )
      `)
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .in('status', ['active', 'past_due', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }

    if (!data) return null;

    type PlanRow = { display_name?: string; price_pence?: number; billing_period?: string };
    const rawPlan = (data as { gym_memberships?: PlanRow | PlanRow[] }).gym_memberships;
    const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;

    return {
      id: data.id,
      gymId: data.gym_id,
      membershipId: data.membership_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      planName: plan?.display_name,
      pricePence: plan?.price_pence,
      billingPeriod: plan?.billing_period,
    };
  },

  /**
   * Start a Stripe Checkout session for the member to subscribe to a plan, and
   * return the hosted checkout URL to redirect to. The server resolves the price
   * from the membership record, so only identifiers are sent here.
   */
  async startCheckout(gymId: string, membershipId: string, userId: string, promoCode?: string): Promise<string> {
    const { url } = await authFetch<{ url: string }>('/api/subscriptions/create-gym-subscription', {
      gymId,
      membershipId,
      userId,
      ...(promoCode ? { promoCode } : {}),
    });
    return url;
  },

  /**
   * Open the Stripe Billing Portal so the member can update their card (the key
   * action when a payment is past due), view invoices, or cancel. Returns the
   * hosted portal URL to redirect to.
   */
  async openBillingPortal(gymId: string): Promise<string> {
    const { url } = await authFetch<{ url: string }>('/api/subscriptions/create-portal-session', {
      gymId,
    });
    return url;
  },

  /**
   * Cancel the subscription at the end of the current billing period.
   * The member keeps access until then.
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await authFetch('/api/subscriptions/cancel-subscription', {
      subscriptionId: stripeSubscriptionId,
    });
  },
};
