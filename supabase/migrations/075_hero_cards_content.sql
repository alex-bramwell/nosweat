-- Add hero_cards JSONB column for customizable Hero action card content
ALTER TABLE public.gym_branding
ADD COLUMN IF NOT EXISTS hero_cards JSONB DEFAULT '{
  "daypass": { "title": "Day Pass", "description": "Drop in for a single session and experience our community", "button": "Book Day Pass" },
  "trial": { "title": "Free Trial", "description": "New here? Try your first class on us, no commitment", "button": "Book Trial Pass" },
  "schedule": { "title": "Class Schedule", "description": "View our full timetable and find a class that fits your day", "button": "View Schedule" }
}'::jsonb;
