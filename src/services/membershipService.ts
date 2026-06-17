import { supabase } from '../lib/supabase';
import type { GymMembership } from '../types/tenant';

// Owner-facing CRUD for a gym's membership plans (gym_memberships). The public
// site and the member subscribe flow read these; this is where gym admins
// define and price their tiers. Writes rely on the "Gym admins can manage
// memberships" RLS policy, so they must be performed by an authenticated admin.

export type MembershipDraft = {
  id: string; // real UUID for existing rows, or a `new:*` placeholder for unsaved ones
  display_name: string;
  description: string;
  price_pence: number | null;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
};

// Stripe prices are immutable, so when the price or billing period of a plan
// changes we drop the cached Stripe price/product ids. create-gym-subscription
// then mints a fresh price on the next subscribe.
function priceChanged(original: GymMembership | undefined, draft: MembershipDraft): boolean {
  if (!original) return false;
  return original.price_pence !== draft.price_pence || original.billing_period !== draft.billing_period;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'plan';
}

// Ensure a slug is unique within the gym by suffixing -2, -3, ... if needed.
function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export const membershipService = {
  /** All plans for a gym (including archived), ordered for the admin list. */
  async listPlans(gymId: string): Promise<GymMembership[]> {
    const { data, error } = await supabase
      .from('gym_memberships')
      .select('*')
      .eq('gym_id', gymId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading membership plans:', error);
      throw error;
    }
    return (data ?? []) as GymMembership[];
  },

  /**
   * Persist the full ordered list of plans for a gym. New rows (id starting
   * `new:`) are inserted; existing rows are updated. sort_order is rewritten to
   * match list order. Returns the refreshed list.
   */
  async savePlans(
    gymId: string,
    drafts: MembershipDraft[],
    originals: GymMembership[]
  ): Promise<GymMembership[]> {
    const originalById = new Map(originals.map((p) => [p.id, p]));
    const takenSlugs = new Set<string>();

    const inserts: Record<string, unknown>[] = [];
    const updates: { id: string; values: Record<string, unknown> }[] = [];

    drafts.forEach((draft, index) => {
      const isNew = draft.id.startsWith('new:');
      const original = originalById.get(draft.id);
      // Keep an existing slug stable; only generate one for brand-new plans.
      const slug = isNew
        ? uniqueSlug(slugify(draft.display_name), takenSlugs)
        : original?.slug ?? uniqueSlug(slugify(draft.display_name), takenSlugs);
      takenSlugs.add(slug);

      const base: Record<string, unknown> = {
        display_name: draft.display_name.trim(),
        description: draft.description.trim() || null,
        price_pence: draft.price_pence,
        billing_period: draft.billing_period,
        features: draft.features.filter((f) => f.trim().length > 0),
        is_active: draft.is_active,
        sort_order: index,
      };

      if (isNew) {
        inserts.push({ gym_id: gymId, slug, ...base });
      } else {
        const values = { ...base };
        if (priceChanged(original, draft)) {
          values.stripe_price_id = null;
          values.stripe_product_id = null;
        }
        updates.push({ id: draft.id, values });
      }
    });

    if (inserts.length > 0) {
      const { error } = await supabase.from('gym_memberships').insert(inserts);
      if (error) {
        console.error('Error creating membership plans:', error);
        throw error;
      }
    }

    for (const u of updates) {
      const { error } = await supabase.from('gym_memberships').update(u.values).eq('id', u.id);
      if (error) {
        console.error('Error updating membership plan:', error);
        throw error;
      }
    }

    return this.listPlans(gymId);
  },
};
