import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useGymPath } from '../contexts/TenantContext';
import { Section, Container, Button } from '../components/common';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/payment';
import type { Booking } from '../types';
import styles from './BookingConfirmation.module.scss';

const BookingConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gymPath = useGymPath();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setIsLoading(false);
      return;
    }

    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setBooking({
          id: data.id,
          userId: data.user_id,
          classId: data.class_id,
          classDay: data.class_day,
          classTime: data.class_time,
          className: data.class_name,
          coachName: data.coach_name,
          bookingType: data.booking_type,
          status: data.status,
          bookedAt: data.booked_at,
          classDate: data.class_date,
          paymentId: data.payment_id,
        });
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Section spacing="large">
        <Container>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading booking details...</p>
          </div>
        </Container>
      </Section>
    );
  }

  if (error || !booking) {
    return (
      <Section spacing="large">
        <Container>
          <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2>Booking Not Found</h2>
            <p>{error || 'We couldn\'t find your booking. Please check your email for confirmation details.'}</p>
            <div className={styles.errorActions}>
              <Button variant="primary" size="large" onClick={() => navigate(gymPath('/dashboard'))}>
                Go to Dashboard
              </Button>
              <Button variant="outline" size="large" onClick={() => navigate(gymPath('/schedule'))}>
                View Schedule
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section spacing="large">
      <Container>
        <div className={styles.confirmation}>
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1 className={styles.title}>Booking Confirmed!</h1>
          <p className={styles.subtitle}>
            Your day pass has been purchased and your class is booked.
            We'll see you at the gym!
          </p>

          <div className={styles.bookingCard}>
            <div className={styles.cardHeader}>
              <h2>Class Details</h2>
              <span className={`${styles.status} ${styles[booking.status]}`}>
                {booking.status}
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  Class
                </div>
                <div className={styles.detailValue}>{booking.className}</div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Day
                </div>
                <div className={styles.detailValue}>{booking.classDay}</div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Time
                </div>
                <div className={styles.detailValue}>{booking.classTime}</div>
              </div>

              {booking.coachName && (
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Coach
                  </div>
                  <div className={styles.detailValue}>{booking.coachName}</div>
                </div>
              )}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.receiptRow}>
                <span>Day Pass</span>
                <span className={styles.amount}>{formatCurrency(1000, 'gbp')}</span>
              </div>
            </div>
          </div>

          <div className={styles.nextSteps}>
            <h3>What's Next?</h3>
            <ul>
              <li>Arrive 10-15 minutes early for your class</li>
              <li>Bring a water bottle and towel</li>
              <li>Wear comfortable workout attire</li>
              <li>Check your email for booking confirmation</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <Link to={gymPath('/dashboard')}>
              <Button variant="primary" size="large">
                View My Bookings
              </Button>
            </Link>
            <Link to={gymPath('/schedule')}>
              <Button variant="outline" size="large">
                Book Another Class
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default BookingConfirmation;
