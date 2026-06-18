-- Normalise the demo gym's membership plans so they showcase the recurring
-- membership feature properly: generic names (no leftover "Comet"/"CrossFit"
-- branding) and only true recurring tiers. The old seed mixed in a £0 "Free
-- Trial" and a per-session "Specialty Program", which aren't recurring
-- memberships and shouldn't live in this list.
--
-- Strictly scoped to the demo gym (slug = 'my-new-gym'); never touches a real
-- gym's plans. Guarded so it is safe if a target row is referenced or absent.

DO $$
DECLARE
  demo_gym_id UUID;
BEGIN
  SELECT id INTO demo_gym_id FROM public.gyms WHERE slug = 'my-new-gym';
  IF demo_gym_id IS NULL THEN
    RETURN;
  END IF;

  -- Drop the non-recurring entries (only if nothing subscribes to them).
  DELETE FROM public.gym_memberships m
  WHERE m.gym_id = demo_gym_id
    AND m.slug IN ('trial', 'specialty')
    AND NOT EXISTS (SELECT 1 FROM public.member_subscriptions s WHERE s.membership_id = m.id);

  -- Unlimited (was "CrossFit").
  UPDATE public.gym_memberships SET
    slug = 'unlimited',
    display_name = 'Unlimited',
    description = 'Full access to every class plus open gym whenever you like.',
    price_pence = 6900,
    billing_period = 'monthly',
    features = ARRAY['Unlimited access to all classes', 'Open gym whenever you like', 'Free entry to community events'],
    sort_order = 0,
    is_active = true
  WHERE gym_id = demo_gym_id AND slug = 'crossfit';

  -- Premium (was "Comet Plus").
  UPDATE public.gym_memberships SET
    slug = 'premium',
    display_name = 'Premium',
    description = 'Everything in Unlimited, with personal coaching and priority booking.',
    price_pence = 8900,
    billing_period = 'monthly',
    features = ARRAY['Everything in Unlimited', 'Monthly 1:1 coaching session', 'Priority class booking'],
    sort_order = 1,
    is_active = true
  WHERE gym_id = demo_gym_id AND slug = 'comet-plus';

  -- Open Gym (kept, just tidied).
  UPDATE public.gym_memberships SET
    display_name = 'Open Gym',
    description = 'Train on your own schedule during staffed open gym hours.',
    price_pence = 4000,
    billing_period = 'monthly',
    features = ARRAY['Open gym access during staffed hours', 'Use of all equipment'],
    sort_order = 2,
    is_active = true
  WHERE gym_id = demo_gym_id AND slug = 'open-gym';
END $$;
