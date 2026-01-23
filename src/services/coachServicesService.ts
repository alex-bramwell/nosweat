import { supabase } from '../lib/supabase';

export type ServiceType = 'pt' | 'specialty_class' | 'sports_massage' | 'nutrition' | 'physio';

export interface CoachService {
  id: string;
  coachId: string;
  serviceType: ServiceType;
  isActive: boolean;
  hourlyRate: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  coachName?: string;
  coachEmail?: string;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  memberId: string;
  coachId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  createdAt: string;
  // Joined data
  coachName?: string;
  memberName?: string;
  serviceType?: ServiceType;
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  pt: 'Personal Training',
  specialty_class: 'Specialty Classes',
  sports_massage: 'Sports Massage',
  nutrition: 'Nutrition',
  physio: 'Physiotherapy',
};

export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  pt: '1-on-1 personal training sessions tailored to your goals',
  specialty_class: 'Specialized group classes like Olympic lifting, gymnastics, etc.',
  sports_massage: 'Sports massage therapy for recovery and injury prevention',
  nutrition: 'Personalized nutrition coaching and meal planning',
  physio: 'Physiotherapy services for injury rehabilitation and prevention',
};

export const coachServicesService = {
  /**
   * Get all services for a specific coach
   */
  async getCoachServices(coachId: string): Promise<CoachService[]> {
    const { data, error } = await supabase
      .from('coach_services')
      .select('*')
      .eq('coach_id', coachId)
      .order('service_type');

    if (error) {
      console.error('Error fetching coach services:', error);
      throw error;
    }

    return (data || []).map(mapToCoachService);
  },

  /**
   * Get active services for a coach (for member view)
   */
  async getActiveCoachServices(coachId: string): Promise<CoachService[]> {
    const { data, error } = await supabase
      .from('coach_services')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('service_type');

    if (error) {
      console.error('Error fetching active coach services:', error);
      throw error;
    }

    return (data || []).map(mapToCoachService);
  },

  /**
   * Get all active services with coach info (for member services tab)
   */
  async getAllActiveServices(): Promise<CoachService[]> {
    const { data, error } = await supabase
      .from('coach_services')
      .select(`
        *,
        profiles!coach_id (
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .order('service_type');

    if (error) {
      console.error('Error fetching all active services:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...mapToCoachService(item),
      coachName: item.profiles?.full_name || 'Unknown',
      coachEmail: item.profiles?.email || '',
    }));
  },

  /**
   * Set services for a coach (admin only)
   * This will enable/disable services based on the provided array
   */
  async setCoachServices(
    coachId: string,
    services: { serviceType: ServiceType; isActive: boolean; hourlyRate?: number; description?: string }[]
  ): Promise<void> {
    // Upsert each service
    for (const service of services) {
      const { error } = await supabase
        .from('coach_services')
        .upsert({
          coach_id: coachId,
          service_type: service.serviceType,
          is_active: service.isActive,
          hourly_rate: service.hourlyRate || null,
          description: service.description || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'coach_id,service_type',
        });

      if (error) {
        console.error('Error setting coach service:', error);
        throw error;
      }
    }
  },

  /**
   * Toggle a specific service for a coach
   */
  async toggleService(coachId: string, serviceType: ServiceType, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('coach_services')
      .upsert({
        coach_id: coachId,
        service_type: serviceType,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'coach_id,service_type',
      });

    if (error) {
      console.error('Error toggling coach service:', error);
      throw error;
    }
  },

  /**
   * Create a service booking
   */
  async createBooking(
    serviceId: string,
    coachId: string,
    memberId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    notes?: string
  ): Promise<ServiceBooking> {
    const { data, error } = await supabase
      .from('service_bookings')
      .insert({
        service_id: serviceId,
        coach_id: coachId,
        member_id: memberId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service booking:', error);
      throw error;
    }

    return mapToServiceBooking(data);
  },

  /**
   * Get bookings for a member
   */
  async getMemberBookings(memberId: string): Promise<ServiceBooking[]> {
    const { data, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        profiles!coach_id (full_name),
        coach_services!service_id (service_type)
      `)
      .eq('member_id', memberId)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching member bookings:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...mapToServiceBooking(item),
      coachName: item.profiles?.full_name || 'Unknown',
      serviceType: item.coach_services?.service_type,
    }));
  },

  /**
   * Get bookings for a coach
   */
  async getCoachBookings(coachId: string): Promise<ServiceBooking[]> {
    const { data, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        profiles!member_id (full_name),
        coach_services!service_id (service_type)
      `)
      .eq('coach_id', coachId)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching coach bookings:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...mapToServiceBooking(item),
      memberName: item.profiles?.full_name || 'Unknown',
      serviceType: item.coach_services?.service_type,
    }));
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  ): Promise<void> {
    const { error } = await supabase
      .from('service_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, 'cancelled');
  },

  /**
   * Update a coach's service rate (coach can only update their own)
   */
  async updateServiceRate(serviceId: string, hourlyRate: number): Promise<void> {
    if (hourlyRate < 0) {
      throw new Error('Hourly rate cannot be negative');
    }

    const { error } = await supabase
      .from('coach_services')
      .update({
        hourly_rate: hourlyRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Error updating service rate:', error);
      throw error;
    }
  },

  /**
   * Update a coach's service description (coach can only update their own)
   */
  async updateServiceDescription(serviceId: string, description: string): Promise<void> {
    const { error } = await supabase
      .from('coach_services')
      .update({
        description: description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Error updating service description:', error);
      throw error;
    }
  },

  /**
   * Get a single service by ID
   */
  async getServiceById(serviceId: string): Promise<CoachService | null> {
    const { data, error } = await supabase
      .from('coach_services')
      .select(`
        *,
        profiles!coach_id (
          full_name,
          email
        )
      `)
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return null;
    }

    return {
      ...mapToCoachService(data),
      coachName: data.profiles?.full_name || 'Unknown',
      coachEmail: data.profiles?.email || '',
    };
  },
};

// Helper to map database row to CoachService
function mapToCoachService(row: any): CoachService {
  return {
    id: row.id,
    coachId: row.coach_id,
    serviceType: row.service_type,
    isActive: row.is_active,
    hourlyRate: row.hourly_rate,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to map database row to ServiceBooking
function mapToServiceBooking(row: any): ServiceBooking {
  return {
    id: row.id,
    serviceId: row.service_id,
    memberId: row.member_id,
    coachId: row.coach_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
