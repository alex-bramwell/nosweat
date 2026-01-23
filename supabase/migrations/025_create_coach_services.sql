-- Create coach_services table to track which services each coach offers
-- Services: PT, Specialty Classes, Sports Massage, Nutrition, Physio

-- Create enum for service types
CREATE TYPE service_type AS ENUM ('pt', 'specialty_class', 'sports_massage', 'nutrition', 'physio');

-- Create coach_services table
CREATE TABLE coach_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Each coach can only have one entry per service type
  UNIQUE(coach_id, service_type)
);

-- Create indexes
CREATE INDEX idx_coach_services_coach_id ON coach_services(coach_id);
CREATE INDEX idx_coach_services_service_type ON coach_services(service_type);
CREATE INDEX idx_coach_services_active ON coach_services(is_active);

-- Enable Row Level Security
ALTER TABLE coach_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view active coach services
CREATE POLICY "Anyone can view active coach services"
  ON coach_services FOR SELECT
  USING (is_active = true);

-- Coaches can view their own services (even inactive)
CREATE POLICY "Coaches can view their own services"
  ON coach_services FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can view all services
CREATE POLICY "Admins can view all coach services"
  ON coach_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert/update/delete coach services
CREATE POLICY "Admins can insert coach services"
  ON coach_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update coach services"
  ON coach_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete coach services"
  ON coach_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create service_bookings table for members to book services
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES coach_services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for service_bookings
CREATE INDEX idx_service_bookings_service_id ON service_bookings(service_id);
CREATE INDEX idx_service_bookings_member_id ON service_bookings(member_id);
CREATE INDEX idx_service_bookings_coach_id ON service_bookings(coach_id);
CREATE INDEX idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX idx_service_bookings_status ON service_bookings(status);

-- Enable RLS on service_bookings
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Members can view their own bookings
CREATE POLICY "Members can view their own service bookings"
  ON service_bookings FOR SELECT
  USING (auth.uid() = member_id);

-- Coaches can view bookings for their services
CREATE POLICY "Coaches can view their service bookings"
  ON service_bookings FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all service bookings"
  ON service_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Members can create bookings
CREATE POLICY "Members can create service bookings"
  ON service_bookings FOR INSERT
  WITH CHECK (auth.uid() = member_id);

-- Members can update their own pending bookings (cancel)
CREATE POLICY "Members can update their own bookings"
  ON service_bookings FOR UPDATE
  USING (auth.uid() = member_id AND status = 'pending')
  WITH CHECK (auth.uid() = member_id);

-- Coaches can update bookings for their services
CREATE POLICY "Coaches can update their service bookings"
  ON service_bookings FOR UPDATE
  USING (auth.uid() = coach_id);

-- Admins can update any booking
CREATE POLICY "Admins can update any service booking"
  ON service_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get service type display name
CREATE OR REPLACE FUNCTION get_service_display_name(stype service_type)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE stype
    WHEN 'pt' THEN 'Personal Training'
    WHEN 'specialty_class' THEN 'Specialty Classes'
    WHEN 'sports_massage' THEN 'Sports Massage'
    WHEN 'nutrition' THEN 'Nutrition'
    WHEN 'physio' THEN 'Physiotherapy'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
