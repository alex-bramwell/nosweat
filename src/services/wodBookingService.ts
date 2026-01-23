import { supabase } from '../lib/supabase';

export interface WorkoutBooking {
  id: string;
  workoutId: string;
  userId: string;
  status: 'booked' | 'cancelled' | 'attended' | 'no-show';
  bookedAt: string;
  cancelledAt?: string;
  // Joined user data
  userName?: string;
  userEmail?: string;
}

export interface BookingWithUser extends WorkoutBooking {
  userName: string;
  userEmail: string;
}

export const MAX_WORKOUT_CAPACITY = 16;

export const wodBookingService = {
  /**
   * Get all bookings for a specific workout (for coaches/admins)
   */
  async getWorkoutBookings(workoutId: string): Promise<BookingWithUser[]> {
    const { data, error } = await supabase
      .from('workout_bookings')
      .select(`
        id,
        workout_id,
        user_id,
        status,
        booked_at,
        cancelled_at,
        profiles!inner (
          full_name,
          email
        )
      `)
      .eq('workout_id', workoutId)
      .eq('status', 'booked')
      .order('booked_at', { ascending: true });

    if (error) {
      console.error('Error fetching workout bookings:', error);
      throw error;
    }

    return (data || []).map((booking: any) => ({
      id: booking.id,
      workoutId: booking.workout_id,
      userId: booking.user_id,
      status: booking.status,
      bookedAt: booking.booked_at,
      cancelledAt: booking.cancelled_at,
      userName: booking.profiles?.full_name || 'Unknown',
      userEmail: booking.profiles?.email || '',
    }));
  },

  /**
   * Get the booking count for a workout
   */
  async getBookingCount(workoutId: string): Promise<number> {
    const { count, error } = await supabase
      .from('workout_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutId)
      .eq('status', 'booked');

    if (error) {
      console.error('Error fetching booking count:', error);
      throw error;
    }

    return count || 0;
  },

  /**
   * Get booking counts for multiple workouts
   */
  async getBookingCountsForWorkouts(workoutIds: string[]): Promise<Record<string, number>> {
    if (workoutIds.length === 0) return {};

    const { data, error } = await supabase
      .from('workout_bookings')
      .select('workout_id')
      .in('workout_id', workoutIds)
      .eq('status', 'booked');

    if (error) {
      console.error('Error fetching booking counts:', error);
      throw error;
    }

    const counts: Record<string, number> = {};
    workoutIds.forEach(id => counts[id] = 0);

    (data || []).forEach((booking: { workout_id: string }) => {
      counts[booking.workout_id] = (counts[booking.workout_id] || 0) + 1;
    });

    return counts;
  },

  /**
   * Check if a user has booked a specific workout
   */
  async isUserBooked(workoutId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('workout_bookings')
      .select('id')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .eq('status', 'booked')
      .maybeSingle();

    if (error) {
      console.error('Error checking user booking:', error);
      throw error;
    }

    return !!data;
  },

  /**
   * Get user's booking for a workout
   */
  async getUserBooking(workoutId: string, userId: string): Promise<WorkoutBooking | null> {
    const { data, error } = await supabase
      .from('workout_bookings')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .eq('status', 'booked')
      .maybeSingle();

    if (error) {
      console.error('Error fetching user booking:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      workoutId: data.workout_id,
      userId: data.user_id,
      status: data.status,
      bookedAt: data.booked_at,
      cancelledAt: data.cancelled_at,
    };
  },

  /**
   * Book a workout for the current user
   */
  async bookWorkout(workoutId: string, userId: string): Promise<WorkoutBooking> {
    // First check capacity
    const currentCount = await this.getBookingCount(workoutId);
    if (currentCount >= MAX_WORKOUT_CAPACITY) {
      throw new Error('This workout is fully booked');
    }

    // Check if already booked
    const existingBooking = await this.getUserBooking(workoutId, userId);
    if (existingBooking) {
      throw new Error('You have already booked this workout');
    }

    const { data, error } = await supabase
      .from('workout_bookings')
      .insert({
        workout_id: workoutId,
        user_id: userId,
        status: 'booked',
      })
      .select()
      .single();

    if (error) {
      console.error('Error booking workout:', error);
      if (error.code === '23505') {
        throw new Error('You have already booked this workout');
      }
      throw error;
    }

    return {
      id: data.id,
      workoutId: data.workout_id,
      userId: data.user_id,
      status: data.status,
      bookedAt: data.booked_at,
      cancelledAt: data.cancelled_at,
    };
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(workoutId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .eq('status', 'booked');

    if (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  /**
   * Update booking status (for coaches/admins to mark attendance)
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'attended' | 'no-show' | 'booked'
  ): Promise<void> {
    const { error } = await supabase
      .from('workout_bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  /**
   * Get all bookings for the current user
   */
  async getUserBookings(userId: string): Promise<WorkoutBooking[]> {
    const { data, error } = await supabase
      .from('workout_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'booked')
      .order('booked_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    return (data || []).map((booking: any) => ({
      id: booking.id,
      workoutId: booking.workout_id,
      userId: booking.user_id,
      status: booking.status,
      bookedAt: booking.booked_at,
      cancelledAt: booking.cancelled_at,
    }));
  },
};
