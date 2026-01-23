-- Add payment tracking fields to service_bookings table
ALTER TABLE service_bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER, -- in pence
ADD COLUMN IF NOT EXISTS refund_eligible_until TIMESTAMPTZ; -- 24 hours before booking start

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_status ON service_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_intent ON service_bookings(payment_intent_id);

-- Add comment for clarity
COMMENT ON COLUMN service_bookings.amount_paid IS 'Amount paid in pence (GBP)';
COMMENT ON COLUMN service_bookings.refund_eligible_until IS 'Timestamp until which the booking is eligible for full refund (24h before booking start)';
