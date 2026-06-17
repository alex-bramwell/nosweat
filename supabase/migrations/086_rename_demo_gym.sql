-- Rename the demo/example gym away from "CrossFit Comet" / slug "comet" to a
-- neutral "My New Gym" / "my-new-gym", so prospective owners see a generic
-- template in both the record and the URL (not a specific CrossFit box).
-- The display-time genericiser in TenantContext still de-CrossFits the seeded
-- class/program content.

UPDATE public.gyms
SET name = 'My New Gym',
    slug = 'my-new-gym',
    contact_email = 'hello@mynewgym.com'
WHERE slug = 'comet';
