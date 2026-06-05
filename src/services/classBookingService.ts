import { supabase } from '../lib/supabase';

export interface ClassBookingInput {
  classId: string;
  classDay: string; // e.g. 'Monday'
  classTime: string; // e.g. '6:00 AM'
  className: string;
  classDate: string; // ISO timestamp of the class start
}

export interface ClassBookingSummary {
  classId: string;
  bookingCount: number;
  userBooked: boolean;
}

export const classBookingService = {
  /**
   * Fetch booking summaries for a set of class instances: total bookings per
   * class (to compute remaining spots) and whether the current user is booked.
   * Backed by a SECURITY DEFINER RPC because bookings RLS hides other members'
   * rows from the client.
   */
  async getClassSummaries(classIds: string[]): Promise<ClassBookingSummary[]> {
    if (classIds.length === 0) return [];

    const { data, error } = await supabase.rpc('get_class_booking_summary', {
      p_class_ids: classIds,
    });

    if (error) {
      console.error('Error fetching class booking summaries:', error);
      throw error;
    }

    return (data || []).map(
      (r: { class_id: string; booking_count: number; user_booked: boolean }) => ({
        classId: r.class_id,
        bookingCount: Number(r.booking_count),
        userBooked: r.user_booked,
      })
    );
  },

  /**
   * Book one or more class instances for a member. Classes are included with
   * membership, so these are written directly as confirmed bookings with no
   * payment. Inserted as booking_type 'membership'. gymId is required - the
   * bookings table has a NOT NULL gym_id and RLS scopes inserts to the
   * member's gym.
   */
  async bookClasses(userId: string, gymId: string, inputs: ClassBookingInput[]): Promise<void> {
    if (inputs.length === 0) return;

    const rows = inputs.map((i) => ({
      user_id: userId,
      gym_id: gymId,
      class_id: i.classId,
      class_day: i.classDay,
      class_time: i.classTime,
      class_name: i.className,
      booking_type: 'membership',
      status: 'confirmed',
      class_date: i.classDate,
    }));

    const { error } = await supabase.from('bookings').insert(rows);

    if (error) {
      console.error('Error booking classes:', error);
      throw error;
    }
  },

  /**
   * Cancel a member's booking for a class instance.
   */
  async cancelClassBooking(userId: string, classId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('class_id', classId)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Error cancelling class booking:', error);
      throw error;
    }
  },
};
